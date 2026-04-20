import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { canCreateProduct } from '@/lib/auth/permissions';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string; pid: string }>;
}

/**
 * POST /api/menus/:id/products/:pid/duplicate
 * Duplicate a product (incl. variations) into the same category.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to duplicate this product',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

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

    const source = await prisma.product.findFirst({
      where: { id: productId, category: { menuId } },
      include: { variations: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!source) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Plan-limit check for total products in this menu
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const productCount = await prisma.product.count({
      where: { category: { menuId } },
    });

    if (!user || !canCreateProduct({ plan: user.plan }, productCount)) {
      return createErrorResponse(
        ERROR_CODES.PLAN_LIMIT_REACHED,
        'Product limit for your plan has been reached',
        403
      );
    }

    // Copy name with " (Copy)" suffix, shift sortOrder to end of category
    const maxSort = await prisma.product.aggregate({
      where: { categoryId: source.categoryId },
      _max: { sortOrder: true },
    });

    const duplicated = await prisma.product.create({
      data: {
        categoryId: source.categoryId,
        nameKa: `${source.nameKa} (Copy)`,
        nameEn: source.nameEn ? `${source.nameEn} (Copy)` : null,
        nameRu: source.nameRu ? `${source.nameRu} (Copy)` : null,
        descriptionKa: source.descriptionKa,
        descriptionEn: source.descriptionEn,
        descriptionRu: source.descriptionRu,
        price: source.price,
        oldPrice: source.oldPrice,
        currency: source.currency,
        imageUrl: source.imageUrl,
        imageFocalX: source.imageFocalX,
        imageFocalY: source.imageFocalY,
        imageZoom: source.imageZoom,
        allergens: source.allergens,
        ribbons: source.ribbons,
        isVegan: source.isVegan,
        isVegetarian: source.isVegetarian,
        calories: source.calories,
        protein: source.protein,
        fats: source.fats,
        carbs: source.carbs,
        fiber: source.fiber,
        isAvailable: source.isAvailable,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        variations: {
          create: source.variations.map((v) => ({
            nameKa: v.nameKa,
            nameEn: v.nameEn,
            nameRu: v.nameRu,
            price: v.price,
            sortOrder: v.sortOrder,
          })),
        },
      },
      include: {
        category: { select: { id: true, nameKa: true, nameEn: true, nameRu: true } },
        variations: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { variations: true } },
      },
    });

    await invalidateMenuCache(menuId, menu.slug);
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_CREATED, duplicated);

    return createSuccessResponse(duplicated, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
