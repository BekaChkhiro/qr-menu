import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updatePromotionSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string; pid: string }>;
}

/**
 * GET /api/menus/:id/promotions/:pid
 * Get a specific promotion
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view this promotion',
        401
      );
    }

    const { id: menuId, pid: promotionId } = await params;

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

    // Fetch promotion
    const promotion = await prisma.promotion.findUnique({
      where: {
        id: promotionId,
        menuId, // Ensure promotion belongs to the specified menu
      },
    });

    if (!promotion) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Promotion not found',
        404
      );
    }

    return createSuccessResponse(promotion);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/menus/:id/promotions/:pid
 * Update a promotion
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update this promotion',
        401
      );
    }

    const { id: menuId, pid: promotionId } = await params;

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

    // Verify promotion exists and belongs to this menu
    const existingPromotion = await prisma.promotion.findUnique({
      where: {
        id: promotionId,
        menuId,
      },
    });

    if (!existingPromotion) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Promotion not found',
        404
      );
    }

    // Validate request body
    const body = await request.json();
    const data = updatePromotionSchema.parse(body);

    // For partial updates, we need to validate dates together
    const updatedStartDate = data.startDate ?? existingPromotion.startDate;
    const updatedEndDate = data.endDate ?? existingPromotion.endDate;

    if (updatedEndDate <= updatedStartDate) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'End date must be after start date',
        400,
        { endDate: ['End date must be after start date'] }
      );
    }

    // Update promotion
    const promotion = await prisma.promotion.update({
      where: { id: promotionId },
      data,
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PROMOTION_UPDATED, promotion);

    return createSuccessResponse(promotion);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/menus/:id/promotions/:pid
 * Delete a promotion
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to delete this promotion',
        401
      );
    }

    const { id: menuId, pid: promotionId } = await params;

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

    // Verify promotion exists and belongs to this menu
    const existingPromotion = await prisma.promotion.findUnique({
      where: {
        id: promotionId,
        menuId,
      },
    });

    if (!existingPromotion) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Promotion not found',
        404
      );
    }

    // Delete promotion
    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PROMOTION_DELETED, { id: promotionId });

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
