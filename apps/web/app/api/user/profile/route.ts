import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updateProfileSchema } from '@/lib/validations/user';

const USER_PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  lastName: true,
  phone: true,
  timezone: true,
  dateFormat: true,
  currency: true,
  priceFormat: true,
  image: true,
  plan: true,
  password: true,
} as const;

/**
 * GET /api/user/profile
 * Returns the signed-in user's profile fields.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view your profile',
        401
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: USER_PROFILE_SELECT,
    });

    if (!user) {
      return createErrorResponse(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    const { password, ...rest } = user;
    return createSuccessResponse({ user: { ...rest, hasPassword: !!password } });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/user/profile
 * Updates the signed-in user's profile fields.
 * Only fields present in the request body are updated.
 * Empty strings for phone, timezone, and image are stored as null (clear the field).
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update your profile',
        401
      );
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Build payload with only the fields that were explicitly provided.
    // Treat empty strings for clearable fields as null.
    const payload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(validated)) {
      if (value === undefined) continue;

      const clearable = key === 'phone' || key === 'timezone' || key === 'image';
      payload[key] = clearable && value === '' ? null : value;
    }

    // If firstName or lastName is being updated, derive the composite `name`
    // field from whichever combination is available after the update.
    if ('firstName' in payload || 'lastName' in payload) {
      const current = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, lastName: true },
      });

      if (!current) {
        return createErrorResponse(
          ERROR_CODES.USER_NOT_FOUND,
          'User not found',
          404
        );
      }

      const resolvedFirst =
        'firstName' in payload
          ? (payload.firstName as string | null)
          : current.firstName;
      const resolvedLast =
        'lastName' in payload
          ? (payload.lastName as string | null)
          : current.lastName;

      payload.name = [resolvedFirst, resolvedLast].filter(Boolean).join(' ') || null;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: payload,
      select: USER_PROFILE_SELECT,
    });

    return createSuccessResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
