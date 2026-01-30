import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { reorderProductsSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/menus/:id/products/reorder
 * Reorder products in a menu (drag-drop)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to reorder products',
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

    // Validate request body
    const body = await request.json();
    const { products } = reorderProductsSchema.parse(body);

    // Verify all products belong to this menu
    const productIds = products.map((p) => p.id);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        category: { menuId },
      },
      select: { id: true },
    });

    const existingIds = new Set(existingProducts.map((p) => p.id));
    const invalidIds = productIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        `Products not found or do not belong to this menu: ${invalidIds.join(', ')}`,
        400
      );
    }

    // Update all sortOrders in a transaction
    await prisma.$transaction(
      products.map((product) =>
        prisma.product.update({
          where: { id: product.id },
          data: { sortOrder: product.sortOrder },
        })
      )
    );

    // Fetch updated products
    const updatedProducts = await prisma.product.findMany({
      where: {
        category: { menuId },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
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
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_REORDERED, updatedProducts);

    return createSuccessResponse(updatedProducts);
  } catch (error) {
    return handleApiError(error);
  }
}
