'use client';

import { useCallback, useRef, useState } from 'react';
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
  onProgress?: (percent: number) => void;
}

/**
 * Upload an image to /api/upload using XHR so we can report
 * browser → server transfer progress. Progress only covers the
 * client-side leg; Cloudinary's processing is still inline on
 * the server but is fast for typical menu/promotion images.
 */
export function useUpload(options: UseUploadOptions = {}) {
  const { onSuccess, onError, onProgress } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<UploadError | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(
    (file: File, uploadOptions?: UploadOptions) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        const err: UploadError = { code: 'VALIDATION_ERROR', message: validation.error };
        setError(err);
        onError?.(err);
        return Promise.reject(err);
      }

      // Cancel any in-flight upload for this hook instance.
      xhrRef.current?.abort();

      return new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        const formData = new FormData();
        formData.append('file', file);
        if (uploadOptions?.preset) formData.append('preset', uploadOptions.preset);
        if (uploadOptions?.folder) formData.append('folder', uploadOptions.folder);

        setIsUploading(true);
        setProgress(0);
        setError(null);
        onProgress?.(0);

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
          setProgress(pct);
          onProgress?.(pct);
        };

        xhr.onload = () => {
          setIsUploading(false);
          try {
            const body = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && body.success) {
              setProgress(100);
              onProgress?.(100);
              const data = body.data as UploadResponse;
              onSuccess?.(data);
              resolve(data);
            } else {
              const err: UploadError = body.error || {
                code: 'UPLOAD_ERROR',
                message: 'Upload failed',
              };
              setError(err);
              onError?.(err);
              reject(err);
            }
          } catch {
            const err: UploadError = { code: 'UPLOAD_ERROR', message: 'Upload failed' };
            setError(err);
            onError?.(err);
            reject(err);
          }
        };

        xhr.onerror = () => {
          setIsUploading(false);
          const err: UploadError = { code: 'NETWORK_ERROR', message: 'Network error during upload' };
          setError(err);
          onError?.(err);
          reject(err);
        };

        xhr.onabort = () => {
          setIsUploading(false);
        };

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });
    },
    [onSuccess, onError, onProgress]
  );

  const reset = useCallback(() => {
    xhrRef.current?.abort();
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    upload,
    uploadAsync: upload,
    isUploading,
    progress,
    error,
    reset,
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
