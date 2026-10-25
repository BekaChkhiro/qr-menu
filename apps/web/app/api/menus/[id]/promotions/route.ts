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
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';
import { logActivity } from '@/lib/activity/log';
import { syncComboProduct } from '@/lib/promotions/combo';
import { isWithinDateRange, notExpiredWhere } from '@/lib/promotions/time-windows';

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
    // Absent params arrive as null, and zod only applies defaults to undefined:
    // without this, page=null fails the whole parse and expired promotions are
    // dropped even when the editor asks for includeExpired=true.
    const queryResult = promotionQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      includeExpired: searchParams.get('includeExpired') ?? undefined,
    });

    const { isActive, includeExpired } = queryResult.success
      ? queryResult.data
      : { isActive: undefined, includeExpired: false };

    // Build where clause
    const where: {
      menuId: string;
      isActive?: boolean;
      OR?: Array<{ endDate: null } | { endDate: { gte: Date } }>;
    } = { menuId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (!includeExpired) {
      // T24.1 — open-ended promotions have no end date and never expire.
      Object.assign(where, notExpiredWhere());
    }

    // Fetch promotions
    // Category name feeds the scope line on each card ("კატეგორია: …").
    // T2.6 — undated promotions all tie on startDate (NULLS FIRST), so without a
    // tiebreak Postgres returned them in arbitrary order and a just-created
    // permanent promotion could land anywhere in the grid. Newest first.
    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      include: {
        category: { select: { id: true, nameKa: true, nameEn: true, nameRu: true } },
      },
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
      select: { userId: true, slug: true, timezone: true },
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
    // T1.5 — the "Date range" switch is UI-only: it is not a column, so it is
    // stripped here and never reaches Prisma. Off = open-ended (both dates null).
    const { dateRangeEnabled, ...values } = createPromotionSchema.parse(body);
    const data = dateRangeEnabled === false ? { ...values, startDate: null, endDate: null } : values;

    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(data as any),
        menuId,
      },
    });

    // T22.24 — materialize / tear down the combo product for COMBO promotions.
    await syncComboProduct(promotion.id);

    // Include category relation for the response
    const promotionWithCategory = await prisma.promotion.findUnique({
      where: { id: promotion.id },
      include: { category: { select: { id: true, nameKa: true, nameEn: true, nameRu: true } } },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PROMOTION_CREATED, promotion);

    // Only log PROMOTION_STARTED for actively-running promotions (start <= now <= end)
    const now = new Date();
    if (promotion.isActive && isWithinDateRange(promotion, now, menu.timezone)) {
      await logActivity({
        userId: session.user.id,
        menuId,
        type: 'PROMOTION_STARTED',
        payload: { promotionName: promotion.titleKa },
      });
    }

    return createSuccessResponse(promotionWithCategory ?? promotion, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
