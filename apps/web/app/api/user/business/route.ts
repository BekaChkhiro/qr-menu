import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updateBusinessSchema } from '@/lib/validations/business';

const BUSINESS_SELECT = {
  id: true,
  userId: true,
  logoUrl: true,
  businessName: true,
  tagline: true,
  cuisines: true,
  priceRange: true,
  taxId: true,
  businessType: true,
  description: true,
  streetAddress: true,
  city: true,
  postalCode: true,
  country: true,
  publicEmail: true,
  publicPhone: true,
  websiteUrl: true,
  instagramHandle: true,
  openingHours: true,
} as const;

/**
 * GET /api/user/business
 * Returns the signed-in user's business info.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view your business info',
        401
      );
    }

    let business = await prisma.business.findUnique({
      where: { userId: session.user.id },
      select: BUSINESS_SELECT,
    });

    // Auto-create a blank business record if one doesn't exist yet.
    if (!business) {
      business = await prisma.business.create({
        data: { userId: session.user.id },
        select: BUSINESS_SELECT,
      });
    }

    return createSuccessResponse({ business });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/user/business
 * Updates the signed-in user's business info.
 * Only fields present in the request body are updated.
 * Empty strings for clearable fields are stored as null.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update your business info',
        401
      );
    }

    const body = await request.json();
    const validated = updateBusinessSchema.parse(body);

    // Build payload — treat empty strings as null for clearable scalar fields.
    const payload: Record<string, unknown> = {};
    const clearableScalars = [
      'logoUrl',
      'businessName',
      'tagline',
      'taxId',
      'businessType',
      'description',
      'streetAddress',
      'city',
      'postalCode',
      'country',
      'publicEmail',
      'publicPhone',
      'websiteUrl',
      'instagramHandle',
    ];

    for (const [key, value] of Object.entries(validated)) {
      if (value === undefined) continue;

      if (key === 'priceRange' && value === 0) {
        payload[key] = null;
        continue;
      }

      if (clearableScalars.includes(key) && value === '') {
        payload[key] = null;
        continue;
      }

      payload[key] = value;
    }

    // Upsert — create if missing, otherwise update.
    const business = await prisma.business.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...payload },
      update: payload,
      select: BUSINESS_SELECT,
    });

    return createSuccessResponse({ business });
  } catch (error) {
    return handleApiError(error);
  }
}
