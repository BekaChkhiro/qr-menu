import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ERROR_CODES,
} from '@/lib/api/error-handler';
import { uploadImage, isCloudinaryConfigured, type ImagePreset } from '@/lib/cloudinary';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  IMAGE_PRESET_VALUES,
  type AllowedMimeType,
} from '@/lib/validations/upload';

/**
 * POST /api/upload
 * Upload an image to Cloudinary
 *
 * Accepts multipart/form-data with:
 * - file: The image file to upload (required)
 * - preset: Image transformation preset (optional, defaults to 'product')
 * - folder: Custom folder path (optional, defaults to 'digital-menu')
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to upload images',
        401
      );
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Image upload service is not configured',
        500
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const preset = (formData.get('preset') as string) || 'product';
    const folder = (formData.get('folder') as string) || `digital-menu/${session.user.id}`;

    // Validate file presence
    if (!file) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'No file provided',
        400
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        400
      );
    }

    // Validate preset
    if (!IMAGE_PRESET_VALUES.includes(preset as ImagePreset)) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid preset. Allowed presets: ${IMAGE_PRESET_VALUES.join(', ')}`,
        400
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      folder,
      preset: preset as ImagePreset,
    });

    return createSuccessResponse(
      {
        url: result.url,
        publicId: result.publicId,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
