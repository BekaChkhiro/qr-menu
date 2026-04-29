import { NextRequest } from 'next/server';
import { z } from 'zod';

// Import the configured Cloudinary singleton — `lib/cloudinary/index.ts` runs
// `cloudinary.config({...})` at module load. Importing the SDK directly from
// `'cloudinary'` would skip that and `api.resource` / `uploader.destroy` would
// throw synchronously with a missing-credentials error, surfacing as a 500.
import cloudinary from '@/lib/cloudinary';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ERROR_CODES,
} from '@/lib/api/error-handler';
import { hasFeature } from '@/lib/auth/permissions';
import { getCloudinaryConfig } from '@/lib/cloudinary/sign';
import {
  getMaxSizeForMimeType,
  mimeTypeForKind,
} from '@/lib/validations/3d-upload';

/**
 * POST /api/upload/3d/finalize
 *
 * Confirm a direct-to-Cloudinary upload, validating ownership and authoritative
 * file size against the model-kind limits. Returns the same `{ url, publicId,
 * kind }` shape as the legacy `/api/upload/3d` route so callers can swap in
 * place.
 *
 * Auth: requires session.
 * Plan gate: PRO only (`arViewer` feature).
 *
 * On size-overflow we destroy the resource so the user's media library never
 * accumulates upload-attempt orphans.
 */
const bodySchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  kind: z.enum(['glb', 'usdz']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to upload 3D models',
        401,
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
        403,
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request body',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const { publicId, secureUrl, kind } = parsed.data;

    const expectedFolderPrefix = `digital-menu/${session.user.id}/ar-models/`;
    if (!publicId.startsWith(expectedFolderPrefix)) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to finalize this upload',
        403,
      );
    }

    const { cloudName } = getCloudinaryConfig();
    let url: URL;
    try {
      url = new URL(secureUrl);
    } catch {
      return createErrorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid asset URL', 400);
    }
    if (url.hostname !== 'res.cloudinary.com' || !url.pathname.includes(`/${cloudName}/`)) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Asset URL does not belong to the configured Cloudinary account',
        400,
      );
    }

    // Authoritative size check — the client could lie about `bytes`, so we
    // ask Cloudinary directly. This is the only place where we trust the
    // file's size for plan-limit purposes.
    const resource = await cloudinary.api
      .resource(publicId, { resource_type: 'raw' })
      .catch(() => null);

    if (!resource) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Uploaded asset not found in Cloudinary',
        404,
      );
    }

    const maxBytes = getMaxSizeForMimeType(mimeTypeForKind(kind));
    if (typeof resource.bytes === 'number' && resource.bytes > maxBytes) {
      // Don't leave oversized garbage in the media library — and don't keep
      // billing the user for storage we're about to refuse.
      await cloudinary.uploader
        .destroy(publicId, { resource_type: 'raw' })
        .catch(() => undefined);
      return createErrorResponse(
        ERROR_CODES.FILE_TOO_LARGE,
        `File too large. Maximum size for ${kind}: ${maxBytes / (1024 * 1024)}MB`,
        400,
      );
    }

    return createSuccessResponse(
      {
        url: secureUrl,
        publicId,
        kind,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
