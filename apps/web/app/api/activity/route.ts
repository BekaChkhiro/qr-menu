import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 50;

/**
 * GET /api/activity?limit=N
 * Return the current user's most recent ActivityLog entries (newest first).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view activity',
        401
      );
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    let limit = DEFAULT_LIMIT;
    if (limitParam !== null) {
      const parsed = Number.parseInt(limitParam, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          '`limit` must be a positive integer',
          400
        );
      }
      limit = Math.min(parsed, MAX_LIMIT);
    }

    const events = await prisma.activityLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        menu: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return createSuccessResponse(events);
  } catch (error) {
    return handleApiError(error);
  }
}
