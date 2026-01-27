import { z } from 'zod';

// Allowed MIME types for image uploads
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// Maximum file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Image preset values
export const IMAGE_PRESET_VALUES = ['product', 'productThumbnail', 'promotion', 'logo'] as const;

/**
 * Schema for validating file metadata before upload
 */
export const uploadMetadataSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z
    .number()
    .min(1, 'File size must be greater than 0')
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    message: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
  }),
  preset: z.enum(IMAGE_PRESET_VALUES).optional().default('product'),
  folder: z.string().optional(),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

/**
 * Schema for upload response
 */
export const uploadResponseSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

/**
 * Validate file before upload (client-side validation)
 */
export function validateFile(file: File): { valid: true } | { valid: false; error: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
