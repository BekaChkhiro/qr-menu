import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { reorderCategoriesSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/menus/:id/categories/reorder
 * Reorder categories in a menu (drag-drop)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to reorder categories',
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
    const { categories } = reorderCategoriesSchema.parse(body);

    // Verify all categories belong to this menu
    const categoryIds = categories.map((c) => c.id);
    const existingCategories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        menuId,
      },
      select: { id: true },
    });

    const existingIds = new Set(existingCategories.map((c) => c.id));
    const invalidIds = categoryIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return createErrorResponse(
        ERROR_CODES.CATEGORY_NOT_FOUND,
        `Categories not found or do not belong to this menu: ${invalidIds.join(', ')}`,
        400
      );
    }

    // Update all sortOrders in a transaction
    await prisma.$transaction(
      categories.map((category) =>
        prisma.category.update({
          where: { id: category.id },
          data: { sortOrder: category.sortOrder },
        })
      )
    );

    // Fetch updated categories
    const updatedCategories = await prisma.category.findMany({
      where: { menuId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.CATEGORY_REORDERED, updatedCategories);

    return createSuccessResponse(updatedCategories);
  } catch (error) {
    return handleApiError(error);
  }
}
