import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ERROR_CODES,
} from '@/lib/api/error-handler';
import { hasFeature } from '@/lib/auth/permissions';
import { getR2Client, getR2Config, isR2Configured, publicUrlForKey } from '@/lib/r2/client';
import {
  MAX_GLB_SIZE,
  MAX_USDZ_SIZE,
  mimeTypeForKind,
  type ModelKind,
} from '@/lib/validations/3d-upload';

/**
 * POST /api/upload/3d/r2-presign
 *
 * Mint a short-lived presigned PUT URL so the browser can stream the
 * .glb / .usdz directly to Cloudflare R2 — no Cloudinary, no Vercel body
 * limit, no per-asset size cap on the free R2 tier.
 *
 * Auth: requires session.
 * Plan gate: PRO only (`arViewer` feature).
 *
 * Request body: { kind: 'glb' | 'usdz', size: number, contentType: string }
 * Response: { presignedUrl, key, publicUrl, contentType, expiresIn }
 *
 * The presigned URL embeds the exact `Content-Type` and `Content-Length` the
 * browser will send. If the client deviates from those values the upload
 * fails — that's our defense against a user lying about file size to dodge
 * the per-kind byte cap.
 */
const PRESIGN_TTL_SECONDS = 5 * 60; // 5 minutes

const bodySchema = z.object({
  kind: z.enum(['glb', 'usdz']),
  size: z.number().int().positive(),
  contentType: z.string().min(1),
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

    if (!isR2Configured()) {
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        '3D model upload service is not configured',
        500,
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid request body',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const { kind, size, contentType } = parsed.data;

    // Reject the wrong content type before we ever sign — saves a round-trip
    // and keeps the presigned URL strictly bound to the kind we authorized.
    const expectedContentType = mimeTypeForKind(kind);
    if (contentType !== expectedContentType) {
      return createErrorResponse(
        ERROR_CODES.INVALID_FILE_TYPE,
        `Content-Type must be ${expectedContentType} for ${kind}`,
        400,
      );
    }

    if (size > MAX_BYTES_BY_KIND[kind]) {
      return createErrorResponse(
        ERROR_CODES.FILE_TOO_LARGE,
        `File too large. Maximum size for ${kind}: ${MAX_BYTES_BY_KIND[kind] / (1024 * 1024)}MB`,
        400,
      );
    }

    const { bucketName } = getR2Config();
    const key = `${session.user.id}/ar-models/${randomUUID()}.${kind}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: PRESIGN_TTL_SECONDS,
      // Lock the signature to exactly these headers — the client must send
      // matching Content-Type and Content-Length or R2 rejects the PUT.
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    return createSuccessResponse({
      presignedUrl,
      key,
      publicUrl: publicUrlForKey(key),
      contentType: expectedContentType,
      expiresIn: PRESIGN_TTL_SECONDS,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
