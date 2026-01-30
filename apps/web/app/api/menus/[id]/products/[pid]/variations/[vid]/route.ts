import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updateProductVariationSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string; pid: string; vid: string }>;
}

/**
 * GET /api/menus/:id/products/:pid/variations/:vid
 * Get a specific variation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view this variation',
        401
      );
    }

    const { id: menuId, pid: productId, vid: variationId } = await params;

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

    // Verify product exists and belongs to this menu
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
    });

    if (!product) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Fetch variation
    const variation = await prisma.productVariation.findFirst({
      where: {
        id: variationId,
        productId,
      },
    });

    if (!variation) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Variation not found',
        404
      );
    }

    return createSuccessResponse(variation);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/menus/:id/products/:pid/variations/:vid
 * Update a variation
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update this variation',
        401
      );
    }

    const { id: menuId, pid: productId, vid: variationId } = await params;

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

    // Verify product exists and belongs to this menu
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
    });

    if (!product) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Verify variation exists
    const existingVariation = await prisma.productVariation.findFirst({
      where: {
        id: variationId,
        productId,
      },
    });

    if (!existingVariation) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Variation not found',
        404
      );
    }

    // Validate request body
    const body = await request.json();
    const data = updateProductVariationSchema.parse(body);

    // Update variation
    const variation = await prisma.productVariation.update({
      where: { id: variationId },
      data,
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_UPDATED, { id: productId });

    return createSuccessResponse(variation);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/menus/:id/products/:pid/variations/:vid
 * Delete a variation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to delete this variation',
        401
      );
    }

    const { id: menuId, pid: productId, vid: variationId } = await params;

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

    // Verify product exists and belongs to this menu
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
    });

    if (!product) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Verify variation exists
    const existingVariation = await prisma.productVariation.findFirst({
      where: {
        id: variationId,
        productId,
      },
    });

    if (!existingVariation) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Variation not found',
        404
      );
    }

    // Delete variation
    await prisma.productVariation.delete({
      where: { id: variationId },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_UPDATED, { id: productId });

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
