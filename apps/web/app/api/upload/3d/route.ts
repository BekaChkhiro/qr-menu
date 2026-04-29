import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ERROR_CODES,
} from '@/lib/api/error-handler';
import { upload3DModel, isCloudinaryConfigured } from '@/lib/cloudinary';
import { hasFeature } from '@/lib/auth/permissions';
import {
  ALLOWED_3D_MIME_TYPES,
  detectModelKind,
  expectedKindForMime,
  getMaxSizeForMimeType,
  type Allowed3DMimeType,
} from '@/lib/validations/3d-upload';

/**
 * POST /api/upload/3d
 * Upload a 3D model (.glb / .usdz) to Cloudinary as a raw asset.
 *
 * Auth: requires session.
 * Plan gate: PRO only (`arViewer` feature).
 *
 * Accepts multipart/form-data with:
 *  - file: the 3D model (required)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to upload 3D models',
        401
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return createErrorResponse(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
    }

    if (!hasFeature(user.plan, 'arViewer')) {
      return createErrorResponse(
        ERROR_CODES.FEATURE_NOT_AVAILABLE,
        'AR / 3D models are only available on the PRO plan. Upgrade to access this feature.',
        403
      );
    }

    if (!isCloudinaryConfigured()) {
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        '3D model upload service is not configured',
        500
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'No file provided', 400);
    }

    if (!ALLOWED_3D_MIME_TYPES.includes(file.type as Allowed3DMimeType)) {
      return createErrorResponse(
        ERROR_CODES.INVALID_FILE_TYPE,
        `Invalid file type. Allowed types: ${ALLOWED_3D_MIME_TYPES.join(', ')}`,
        400
      );
    }

    const mimeType = file.type as Allowed3DMimeType;
    const maxSize = getMaxSizeForMimeType(mimeType);

    if (file.size > maxSize) {
      return createErrorResponse(
        ERROR_CODES.FILE_TOO_LARGE,
        `File too large. Maximum size for ${mimeType}: ${maxSize / (1024 * 1024)}MB`,
        400
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const detectedKind = detectModelKind(buffer);
    const expectedKind = expectedKindForMime(mimeType);

    if (detectedKind !== expectedKind) {
      return createErrorResponse(
        ERROR_CODES.INVALID_FILE_TYPE,
        'File contents do not match the declared type. ' +
          'Expected a valid .glb (glTF binary) or .usdz (zipped USD) file.',
        400
      );
    }

    const result = await upload3DModel(buffer, {
      folder: `digital-menu/${session.user.id}/ar-models`,
    });

    return createSuccessResponse(
      {
        url: result.url,
        publicId: result.publicId,
        kind: detectedKind,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
