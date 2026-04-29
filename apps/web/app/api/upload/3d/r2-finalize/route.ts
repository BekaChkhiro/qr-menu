import { NextRequest } from 'next/server';
import { z } from 'zod';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ERROR_CODES,
} from '@/lib/api/error-handler';
import { hasFeature } from '@/lib/auth/permissions';
import { getR2Client, getR2Config, publicUrlForKey } from '@/lib/r2/client';
import {
  MAX_GLB_SIZE,
  MAX_USDZ_SIZE,
  type ModelKind,
} from '@/lib/validations/3d-upload';

/**
 * POST /api/upload/3d/r2-finalize
 *
 * Confirm a direct-to-R2 upload, validating ownership and authoritative size
 * (HEAD against the bucket, since the client could lie about Content-Length
 * by tampering with the signed PUT — though R2 will reject mismatches).
 *
 * Returns the same `{ url, publicId, kind }` shape as the legacy
 * `/api/upload/3d` route so callers can swap in place.
 *
 * Auth: requires session.
 * Plan gate: PRO only (`arViewer` feature).
 */
const bodySchema = z.object({
  key: z.string().min(1),
  kind: z.enum(['glb', 'usdz']),
});

const MAX_BYTES_BY_KIND: Record<ModelKind, number> = {
  glb: MAX_GLB_SIZE,
  usdz: MAX_USDZ_SIZE,
};

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

    const { key, kind } = parsed.data;

    // Ownership: every key must live under `<userId>/ar-models/`. This prevents
    // a malicious client from finalizing somebody else's upload.
    const expectedPrefix = `${session.user.id}/ar-models/`;
    if (!key.startsWith(expectedPrefix)) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to finalize this upload',
        403,
      );
    }

    const { bucketName } = getR2Config();
    const client = getR2Client();

    const head = await client
      .send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
      .catch(() => null);

    if (!head) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Uploaded asset not found in R2',
        404,
      );
    }

    const maxBytes = MAX_BYTES_BY_KIND[kind];
    if (typeof head.ContentLength === 'number' && head.ContentLength > maxBytes) {
      // Authoritative size mismatch — purge the orphan and refuse.
      await client
        .send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
        .catch(() => undefined);
      return createErrorResponse(
        ERROR_CODES.FILE_TOO_LARGE,
        `File too large. Maximum size for ${kind}: ${maxBytes / (1024 * 1024)}MB`,
        400,
      );
    }

    return createSuccessResponse(
      {
        url: publicUrlForKey(key),
        publicId: key,
        kind,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
