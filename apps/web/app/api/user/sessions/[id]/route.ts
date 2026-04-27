import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/user/sessions/:id
 * Revokes a specific database session.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in',
        401
      );
    }

    // Prevent deleting the current inferred session (it has id 'current')
    if (id === 'current') {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Use sign out to end your current session',
        403
      );
    }

    // Ensure the session belongs to the current user
    const dbSession = await prisma.session.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!dbSession || dbSession.userId !== session.user.id) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Session not found',
        404
      );
    }

    await prisma.session.delete({
      where: { id },
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
