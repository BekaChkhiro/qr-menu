import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ERROR_CODES,
} from '@/lib/api/error-handler';
import { hasFeature } from '@/lib/auth/permissions';
import { getCloudinaryConfig, signUploadParams } from '@/lib/cloudinary/sign';

/**
 * POST /api/upload/3d/signature
 *
 * Mint a Cloudinary direct-upload signature so the browser can POST the
 * .glb / .usdz directly to `https://api.cloudinary.com/v1_1/<cloud>/raw/upload`,
 * bypassing Vercel's ~4.5 MB serverless body limit.
 *
 * Auth: requires session.
 * Plan gate: PRO only (`arViewer` feature).
 *
 * Request body: { kind: 'glb' | 'usdz' }
 * Response: { signature, timestamp, apiKey, cloudName, folder, publicIdPrefix, resourceType }
 */
const bodySchema = z.object({
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

    const { cloudName, apiKey } = getCloudinaryConfig();

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `digital-menu/${session.user.id}/ar-models`;
    // Locking the public_id_prefix means the client cannot reuse this
    // signature to overwrite or upload outside the path we authorized.
    const publicIdPrefix = `${folder}/${randomUUID()}`;

    const signature = signUploadParams({ folder, public_id_prefix: publicIdPrefix, timestamp });

    return createSuccessResponse({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      publicIdPrefix,
      resourceType: 'raw' as const,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
