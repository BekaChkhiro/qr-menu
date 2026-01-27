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

interface RouteParams {
  params: Promise<{ id: string; pid: string; vid: string }>;
}

/**
 * Helper to verify menu ownership, product existence, and variation existence
 */
async function verifyAccess(
  menuId: string,
  productId: string,
  variationId: string,
  userId: string
) {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    select: { userId: true, slug: true },
  });

  if (!menu) {
    return { error: 'MENU_NOT_FOUND' as const };
  }

  if (menu.userId !== userId) {
    return { error: 'FORBIDDEN' as const };
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      category: { menuId },
    },
  });

  if (!product) {
    return { error: 'PRODUCT_NOT_FOUND' as const };
  }

  const variation = await prisma.productVariation.findFirst({
    where: {
      id: variationId,
      productId,
    },
  });

  if (!variation) {
    return { error: 'VARIATION_NOT_FOUND' as const };
  }

  return { menu, product, variation };
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

    const access = await verifyAccess(menuId, productId, variationId, session.user.id);
    if ('error' in access) {
      if (access.error === 'MENU_NOT_FOUND') {
        return createErrorResponse(ERROR_CODES.MENU_NOT_FOUND, 'Menu not found', 404);
      }
      if (access.error === 'FORBIDDEN') {
        return createErrorResponse(
          ERROR_CODES.FORBIDDEN,
          'You do not have permission to view this menu',
          403
        );
      }
      if (access.error === 'PRODUCT_NOT_FOUND') {
        return createErrorResponse(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      }
      if (access.error === 'VARIATION_NOT_FOUND') {
        return createErrorResponse(
          ERROR_CODES.VARIATION_NOT_FOUND,
          'Variation not found',
          404
        );
      }
    }

    return createSuccessResponse(access.variation);
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

    const access = await verifyAccess(menuId, productId, variationId, session.user.id);
    if ('error' in access) {
      if (access.error === 'MENU_NOT_FOUND') {
        return createErrorResponse(ERROR_CODES.MENU_NOT_FOUND, 'Menu not found', 404);
      }
      if (access.error === 'FORBIDDEN') {
        return createErrorResponse(
          ERROR_CODES.FORBIDDEN,
          'You do not have permission to modify this menu',
          403
        );
      }
      if (access.error === 'PRODUCT_NOT_FOUND') {
        return createErrorResponse(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      }
      if (access.error === 'VARIATION_NOT_FOUND') {
        return createErrorResponse(
          ERROR_CODES.VARIATION_NOT_FOUND,
          'Variation not found',
          404
        );
      }
    }

    const body = await request.json();
    const data = updateProductVariationSchema.parse(body);

    const variation = await prisma.productVariation.update({
      where: { id: variationId },
      data,
    });

    // Invalidate cache
    if ('menu' in access) {
      await invalidateMenuCache(menuId, access.menu.slug);
    }

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

    const access = await verifyAccess(menuId, productId, variationId, session.user.id);
    if ('error' in access) {
      if (access.error === 'MENU_NOT_FOUND') {
        return createErrorResponse(ERROR_CODES.MENU_NOT_FOUND, 'Menu not found', 404);
      }
      if (access.error === 'FORBIDDEN') {
        return createErrorResponse(
          ERROR_CODES.FORBIDDEN,
          'You do not have permission to modify this menu',
          403
        );
      }
      if (access.error === 'PRODUCT_NOT_FOUND') {
        return createErrorResponse(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      }
      if (access.error === 'VARIATION_NOT_FOUND') {
        return createErrorResponse(
          ERROR_CODES.VARIATION_NOT_FOUND,
          'Variation not found',
          404
        );
      }
    }

    await prisma.productVariation.delete({
      where: { id: variationId },
    });

    // Invalidate cache
    if ('menu' in access) {
      await invalidateMenuCache(menuId, access.menu.slug);
    }

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
