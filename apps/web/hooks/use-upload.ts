'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ImagePreset } from '@/lib/cloudinary';
import { validateFile, type UploadResponse } from '@/lib/validations/upload';

interface UploadOptions {
  preset?: ImagePreset;
  folder?: string;
}

interface UploadError {
  code: string;
  message: string;
  details?: unknown;
}

interface UseUploadOptions {
  onSuccess?: (data: UploadResponse) => void;
  onError?: (error: UploadError) => void;
}

/**
 * Custom hook for handling image uploads
 */
export function useUpload(options: UseUploadOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutation<UploadResponse, UploadError, { file: File; options?: UploadOptions }>({
    mutationFn: async ({ file, options: uploadOptions }) => {
      // Client-side validation
      const validation = validateFile(file);
      if (!validation.valid) {
        throw { code: 'VALIDATION_ERROR', message: validation.error };
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      if (uploadOptions?.preset) {
        formData.append('preset', uploadOptions.preset);
      }
      if (uploadOptions?.folder) {
        formData.append('folder', uploadOptions.folder);
      }

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw data.error || { code: 'UPLOAD_ERROR', message: 'Upload failed' };
      }

      return data.data as UploadResponse;
    },
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const upload = useCallback(
    (file: File, uploadOptions?: UploadOptions) => {
      return mutation.mutateAsync({ file, options: uploadOptions });
    },
    [mutation]
  );

  return {
    upload,
    uploadAsync: upload,
    isUploading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Hook for managing file preview state
 */
export function useFilePreview() {
  const [preview, setPreview] = useState<string | null>(null);

  const createPreview = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return url;
  }, []);

  const clearPreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
  }, [preview]);

  return {
    preview,
    createPreview,
    clearPreview,
  };
}
