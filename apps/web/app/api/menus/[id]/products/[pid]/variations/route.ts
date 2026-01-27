import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { createProductVariationSchema, bulkCreateVariationsSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';

interface RouteParams {
  params: Promise<{ id: string; pid: string }>;
}

/**
 * Helper to verify menu ownership and product existence
 */
async function verifyAccess(menuId: string, productId: string, userId: string) {
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

  return { menu, product };
}

/**
 * GET /api/menus/:id/products/:pid/variations
 * List all variations for a product
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view variations',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

    const access = await verifyAccess(menuId, productId, session.user.id);
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
    }

    const variations = await prisma.productVariation.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    return createSuccessResponse(variations);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/menus/:id/products/:pid/variations
 * Create a new variation for a product
 * Supports single or bulk creation (if body has 'variations' array)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to create variations',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

    const access = await verifyAccess(menuId, productId, session.user.id);
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
    }

    const body = await request.json();

    // Check if this is a bulk create request
    if ('variations' in body && Array.isArray(body.variations)) {
      // Bulk create
      const data = bulkCreateVariationsSchema.parse(body);

      // Get current max sortOrder
      const maxSortOrder = await prisma.productVariation.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });
      const startSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

      // Create all variations
      const variations = await prisma.$transaction(
        data.variations.map((variation, index) =>
          prisma.productVariation.create({
            data: {
              ...variation,
              productId,
              sortOrder: variation.sortOrder ?? startSortOrder + index,
            },
          })
        )
      );

      // Invalidate cache
      if ('menu' in access) {
        await invalidateMenuCache(menuId, access.menu.slug);
      }

      return createSuccessResponse(variations, 201);
    } else {
      // Single create
      const data = createProductVariationSchema.parse(body);

      // Get next sortOrder
      const maxSortOrder = await prisma.productVariation.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      });
      const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

      const variation = await prisma.productVariation.create({
        data: {
          ...data,
          productId,
          sortOrder: data.sortOrder ?? nextSortOrder,
        },
      });

      // Invalidate cache
      if ('menu' in access) {
        await invalidateMenuCache(menuId, access.menu.slug);
      }

      return createSuccessResponse(variation, 201);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
