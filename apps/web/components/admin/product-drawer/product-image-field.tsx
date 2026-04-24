'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Crop as CropIcon, Trash2, Utensils, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpload, useFilePreview } from '@/hooks/use-upload';
import { validateFile, ALLOWED_MIME_TYPES } from '@/lib/validations/upload';
import { ImageCropper } from '@/components/admin/image-cropper';

interface ProductImageFieldProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  replaceLabel?: string;
  cropLabel?: string;
  removeLabel?: string;
  recommendedText?: string;
  imageLabel?: string;
}

export function ProductImageField({
  value,
  onChange,
  disabled = false,
  replaceLabel = 'Replace',
  cropLabel = 'Crop',
  removeLabel = 'Remove',
  recommendedText = 'Recommended: square, min 800 × 800px',
  imageLabel = 'Product image',
}: ProductImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { preview, createPreview, clearPreview } = useFilePreview();

  const { upload, isUploading } = useUpload({
    onSuccess: (data) => {
      onChange(data.url);
      clearPreview();
      setUploadError(null);
    },
    onError: (err) => {
      setUploadError(err.message || 'Upload failed');
      clearPreview();
    },
  });

  const uploadBlob = useCallback(
    async (blob: Blob, fileName: string) => {
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      createPreview(file);
      try {
        await upload(file, { preset: 'product' });
      } catch {
        // handled by onError
      }
    },
    [createPreview, upload],
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadError(null);
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error);
        return;
      }
      // Open cropper
      const reader = new FileReader();
      reader.onload = () => {
        setCropperSrc(String(reader.result));
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = '';
    },
    [handleFileSelect],
  );

  const handleReplace = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleCrop = () => {
    const displayUrl = preview || value;
    if (displayUrl) {
      setCropperSrc(displayUrl);
    }
  };

  const handleRemove = () => {
    onChange(null);
    clearPreview();
    setUploadError(null);
  };

  const displayUrl = preview || value;

  return (
    <div className="mb-6 flex gap-4">
      {/* 140×140 image tile */}
      <div
        className="relative h-[140px] w-[140px] flex-shrink-0 overflow-hidden rounded-[10px]"
        data-testid="product-basics-image-140"
      >
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Product preview"
              fill
              sizes="140px"
              className="object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            )}
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #C9A074, #7A5A2B)',
            }}
          >
            {/* Diagonal stripe overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 10px, transparent 10px 20px)',
              }}
            />
            {/* Centered utensils icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Utensils
                className="text-white/80"
                style={{ width: 30, height: 30 }}
                strokeWidth={1.5}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right col: label + action buttons + hint */}
      <div className="flex flex-1 flex-col gap-1.5">
        {/* Field label */}
        <div className="text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
          {imageLabel}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            data-testid="product-basics-image-replace"
            onClick={handleReplace}
            disabled={disabled || isUploading}
            aria-label={replaceLabel}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-[5px] text-[12px] font-medium text-text-muted',
              'hover:border-text-subtle hover:text-text-default',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
              'disabled:pointer-events-none disabled:opacity-50',
              'transition-colors',
            )}
          >
            <Upload className="h-[13px] w-[13px]" strokeWidth={1.5} aria-hidden="true" />
            {replaceLabel}
          </button>

          {displayUrl && (
            <button
              type="button"
              data-testid="product-basics-image-crop"
              onClick={handleCrop}
              disabled={disabled || isUploading}
              aria-label={cropLabel}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-[5px] text-[12px] font-medium text-text-muted',
                'hover:border-text-subtle hover:text-text-default',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                'disabled:pointer-events-none disabled:opacity-50',
                'transition-colors',
              )}
            >
              <CropIcon className="h-[13px] w-[13px]" strokeWidth={1.5} aria-hidden="true" />
              {cropLabel}
            </button>
          )}

          {displayUrl && (
            <button
              type="button"
              data-testid="product-basics-image-remove"
              onClick={handleRemove}
              disabled={disabled}
              aria-label={removeLabel}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-[5px] text-[12px] font-medium text-text-muted',
                'hover:border-danger-soft hover:text-danger',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-1',
                'disabled:pointer-events-none disabled:opacity-50',
                'transition-colors',
              )}
            >
              <Trash2 className="h-[13px] w-[13px]" strokeWidth={1.5} aria-hidden="true" />
              {removeLabel}
            </button>
          )}
        </div>

        {/* Hint text */}
        <p className="mt-1 text-[11px] text-text-subtle">{recommendedText}</p>

        {uploadError && (
          <p className="text-[11px] text-danger">{uploadError}</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-hidden="true"
      />

      {/* Cropper modal */}
      {cropperSrc && (
        <ImageCropper
          open={!!cropperSrc}
          onOpenChange={(v) => !v && setCropperSrc(null)}
          imageSrc={cropperSrc}
          defaultAspect="square"
          onCropConfirm={async (blob) => {
            await uploadBlob(blob, `cropped-${Date.now()}.jpg`);
          }}
        />
      )}
    </div>
  );
}
