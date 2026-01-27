import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { createPromotionSchema, promotionQuerySchema } from '@/lib/validations';
import { hasFeature } from '@/lib/auth/permissions';
import { invalidateMenuCache } from '@/lib/cache/redis';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/menus/:id/promotions
 * List all promotions for a menu
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view promotions',
        401
      );
    }

    const { id: menuId } = await params;

    // Verify menu exists and belongs to user
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { userId: true },
    });

    if (!menu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    if (menu.userId !== session.user.id) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to view this menu',
        403
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryResult = promotionQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      isActive: searchParams.get('isActive'),
      includeExpired: searchParams.get('includeExpired'),
    });

    const { isActive, includeExpired } = queryResult.success
      ? queryResult.data
      : { isActive: undefined, includeExpired: false };

    // Build where clause
    const where: {
      menuId: string;
      isActive?: boolean;
      endDate?: { gte: Date };
    } = { menuId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (!includeExpired) {
      where.endDate = { gte: new Date() };
    }

    // Fetch promotions
    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { startDate: 'desc' },
    });

    return createSuccessResponse(promotions);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/menus/:id/promotions
 * Create a new promotion in a menu
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to create a promotion',
        401
      );
    }

    const { id: menuId } = await params;

    // Verify menu exists and belongs to user
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { userId: true, slug: true },
    });

    if (!menu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    if (menu.userId !== session.user.id) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to modify this menu',
        403
      );
    }

    // Check plan feature
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return createErrorResponse(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    if (!hasFeature(user.plan, 'promotions')) {
      return createErrorResponse(
        ERROR_CODES.FEATURE_NOT_AVAILABLE,
        'Promotions are only available for STARTER and PRO plans. Upgrade to access this feature.',
        403
      );
    }

    // Validate request body
    const body = await request.json();
    const data = createPromotionSchema.parse(body);

    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        ...data,
        menuId,
      },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    return createSuccessResponse(promotion, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
