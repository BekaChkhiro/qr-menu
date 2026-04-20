'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, ImageIcon, AlertCircle, Crop as CropIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUpload, useFilePreview } from '@/hooks/use-upload';
import {
  validateFile,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '@/lib/validations/upload';
import type { ImagePreset } from '@/lib/cloudinary';
import { ImageCropper, type CropAspect } from './image-cropper';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  preset?: ImagePreset;
  folder?: string;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  enableCropper?: boolean;
}

const ASPECT_RATIOS = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[2/1]',
} as const;

const ASPECT_TO_CROP: Record<NonNullable<ImageUploadProps['aspectRatio']>, CropAspect> = {
  square: 'square',
  video: 'landscape',
  wide: 'landscape',
};

export function ImageUpload({
  value,
  onChange,
  preset = 'product',
  folder,
  disabled = false,
  className,
  aspectRatio = 'square',
  enableCropper = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  const { preview, createPreview, clearPreview } = useFilePreview();
  const { upload, isUploading } = useUpload({
    onSuccess: (data) => {
      onChange(data.url);
      clearPreview();
      setError(null);
    },
    onError: (err) => {
      setError(err.message || 'Upload failed');
      clearPreview();
    },
  });

  const uploadBlob = useCallback(
    async (blob: Blob, fileName: string) => {
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      const objUrl = URL.createObjectURL(file);
      createPreview(file);
      try {
        await upload(file, { preset, folder });
      } catch {
        // handled in onError
      }
      URL.revokeObjectURL(objUrl);
    },
    [createPreview, upload, preset, folder]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      if (enableCropper) {
        // Open cropper with this file
        const reader = new FileReader();
        reader.onload = () => {
          setCropperSrc(String(reader.result));
        };
        reader.readAsDataURL(file);
        return;
      }

      createPreview(file);
      try {
        await upload(file, { preset, folder });
      } catch {
        // handled in onError
      }
    },
    [upload, preset, folder, createPreview, enableCropper]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      e.target.value = '';
    },
    [handleFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, isUploading, handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    clearPreview();
    setError(null);
  }, [onChange, clearPreview]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleRecrop = useCallback(async () => {
    if (!value) return;
    // Load current image into cropper (cross-origin must allow it)
    setCropperSrc(value);
  }, [value]);

  const displayUrl = preview || value;
  const cropAspect: CropAspect = ASPECT_TO_CROP[aspectRatio];

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border-2 border-dashed transition-colors',
          ASPECT_RATIOS[aspectRatio],
          dragActive && 'border-primary bg-primary/5',
          error && 'border-destructive',
          !displayUrl && !dragActive && !error && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          displayUrl && 'border-transparent',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={displayUrl ? 'Change image' : 'Upload image'}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-hidden="true"
        />

        {displayUrl && (
          <div className="absolute inset-0">
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {!isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                <span className="text-sm font-medium text-white">Click to change</span>
              </div>
            )}
          </div>
        )}

        {!displayUrl && !isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="rounded-full bg-muted p-3">
              {dragActive ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {dragActive ? 'Drop image here' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP or GIF (max {MAX_FILE_SIZE / (1024 * 1024)}MB)
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {displayUrl && !isUploading && !disabled && (
        <div className="flex gap-2">
          {enableCropper && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRecrop();
              }}
              className="flex-1"
            >
              <CropIcon className="mr-2 h-4 w-4" />
              Recrop
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      )}

      {cropperSrc && (
        <ImageCropper
          open={!!cropperSrc}
          onOpenChange={(v) => !v && setCropperSrc(null)}
          imageSrc={cropperSrc}
          defaultAspect={cropAspect}
          onCropConfirm={async (blob) => {
            await uploadBlob(blob, `cropped-${Date.now()}.jpg`);
          }}
        />
      )}
    </div>
  );
}
