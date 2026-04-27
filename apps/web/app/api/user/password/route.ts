import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updatePasswordSchema } from '@/lib/validations/user';
import bcrypt from 'bcryptjs';

/**
 * PATCH /api/user/password
 * Updates the signed-in user's password.
 * Requires current password for verification.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to change your password',
        401
      );
    }

    const body = await request.json();
    const validated = updatePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return createErrorResponse(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    // OAuth users without a password can't use this endpoint
    if (!user.password) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You signed up with a social account and do not have a password set.',
        403
      );
    }

    const isCurrentValid = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!isCurrentValid) {
      return createErrorResponse(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Current password is incorrect',
        401
      );
    }

    const hashedNewPassword = await bcrypt.hash(validated.newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
        sessionVersion: { increment: 1 },
      },
    });

    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
