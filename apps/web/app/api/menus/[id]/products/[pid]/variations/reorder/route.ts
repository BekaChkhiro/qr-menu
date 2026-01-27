import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { reorderVariationsSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';

interface RouteParams {
  params: Promise<{ id: string; pid: string }>;
}

/**
 * POST /api/menus/:id/products/:pid/variations/reorder
 * Reorder variations within a product
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to reorder variations',
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
      return createErrorResponse(ERROR_CODES.MENU_NOT_FOUND, 'Menu not found', 404);
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
      return createErrorResponse(ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
    }

    // Validate request body
    const body = await request.json();
    const { variations } = reorderVariationsSchema.parse(body);

    // Verify all variations belong to this product
    const variationIds = variations.map((v) => v.id);
    const existingVariations = await prisma.productVariation.findMany({
      where: {
        id: { in: variationIds },
        productId,
      },
      select: { id: true },
    });

    if (existingVariations.length !== variationIds.length) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'One or more variations do not belong to this product',
        400
      );
    }

    // Update all variations in a transaction
    await prisma.$transaction(
      variations.map(({ id, sortOrder }) =>
        prisma.productVariation.update({
          where: { id },
          data: { sortOrder },
        })
      )
    );

    // Fetch updated variations
    const updatedVariations = await prisma.productVariation.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    return createSuccessResponse(updatedVariations);
  } catch (error) {
    return handleApiError(error);
  }
}
