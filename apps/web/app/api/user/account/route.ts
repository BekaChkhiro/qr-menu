import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';

/**
 * DELETE /api/user/account
 * Permanently deletes the signed-in user and all associated data.
 */
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in',
        401
      );
    }

    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
