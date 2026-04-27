import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updateNotificationsSchema } from '@/lib/validations/notifications';

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  email: true,
  menuEditEmail: true,
  menuEditPush: true,
  outOfStockEmail: true,
  outOfStockPush: true,
  weeklyDigestEmail: true,
  weeklyDigestPush: true,
  invoiceReadyEmail: true,
  invoiceReadyPush: true,
  paymentFailedEmail: true,
  paymentFailedPush: true,
  newSignInEmail: true,
  newSignInPush: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * GET /api/user/notifications
 * Returns the signed-in user's notification preferences.
 * Creates a default row if one doesn't exist yet.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view your notification preferences',
        401
      );
    }

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
      select: NOTIFICATION_SELECT,
    });

    if (!prefs) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });

      prefs = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          email: user?.email ?? '',
        },
        select: NOTIFICATION_SELECT,
      });
    }

    return createSuccessResponse({ preferences: prefs });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/user/notifications
 * Updates the signed-in user's notification preferences.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update your notification preferences',
        401
      );
    }

    const body = await request.json();
    const validated = updateNotificationsSchema.parse(body);

    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validated)) {
      if (value !== undefined) payload[key] = value;
    }

    // Ensure the row exists before updating (upsert pattern)
    const existing = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    if (!existing) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });

      const prefs = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          email: user?.email ?? '',
          ...payload,
        },
        select: NOTIFICATION_SELECT,
      });

      return createSuccessResponse({ preferences: prefs });
    }

    const prefs = await prisma.notificationPreference.update({
      where: { userId: session.user.id },
      data: payload,
      select: NOTIFICATION_SELECT,
    });

    return createSuccessResponse({ preferences: prefs });
  } catch (error) {
    return handleApiError(error);
  }
}
