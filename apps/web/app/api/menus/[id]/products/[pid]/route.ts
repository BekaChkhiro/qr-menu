import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updateProductSchema } from '@/lib/validations';
import { hasFeature } from '@/lib/auth/permissions';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string; pid: string }>;
}

/**
 * GET /api/menus/:id/products/:pid
 * Get a specific product
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view this product',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

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

    // Fetch product with variations
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
      include: {
        category: {
          select: {
            id: true,
            nameKa: true,
            nameEn: true,
            nameRu: true,
          },
        },
        variations: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { variations: true },
        },
      },
    });

    if (!product) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    return createSuccessResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/menus/:id/products/:pid
 * Update a product
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update this product',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

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
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
    });

    if (!existingProduct) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Validate request body
    const body = await request.json();
    const data = updateProductSchema.parse(body);

    // If changing category, verify new category belongs to this menu
    if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
      const newCategory = await prisma.category.findUnique({
        where: {
          id: data.categoryId,
          menuId,
        },
      });

      if (!newCategory) {
        return createErrorResponse(
          ERROR_CODES.CATEGORY_NOT_FOUND,
          'Target category not found or does not belong to this menu',
          400
        );
      }
    }

    // Check allergens feature availability if updating allergens
    if (data.allergens && data.allergens.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
      });

      if (!user || !hasFeature(user.plan, 'allergens')) {
        return createErrorResponse(
          ERROR_CODES.FEATURE_NOT_AVAILABLE,
          'Allergens feature is not available in your plan. Upgrade to PRO to use allergens.',
          403
        );
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: {
        category: {
          select: {
            id: true,
            nameKa: true,
            nameEn: true,
            nameRu: true,
          },
        },
        variations: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { variations: true },
        },
      },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_UPDATED, product);

    return createSuccessResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/menus/:id/products/:pid
 * Delete a product
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to delete this product',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

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
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
    });

    if (!existingProduct) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Delete product (variations will cascade delete)
    await prisma.product.delete({
      where: { id: productId },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_DELETED, { id: productId });

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
