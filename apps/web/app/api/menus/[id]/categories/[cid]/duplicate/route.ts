import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { canCreateCategory, canCreateProduct } from '@/lib/auth/permissions';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string; cid: string }>;
}

/**
 * POST /api/menus/:id/categories/:cid/duplicate
 * Duplicate a category including all its products & variations.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to duplicate this category',
        401
      );
    }

    const { id: menuId, cid: categoryId } = await params;

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

    const source = await prisma.category.findFirst({
      where: { id: categoryId, menuId },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: { variations: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    if (!source) {
      return createErrorResponse(
        ERROR_CODES.CATEGORY_NOT_FOUND,
        'Category not found',
        404
      );
    }

    // Plan-limit checks: categories + products
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const [categoryCount, productCount] = await Promise.all([
      prisma.category.count({ where: { menuId } }),
      prisma.product.count({ where: { category: { menuId } } }),
    ]);

    if (!user || !canCreateCategory({ plan: user.plan }, categoryCount)) {
      return createErrorResponse(
        ERROR_CODES.PLAN_LIMIT_REACHED,
        'Category limit for your plan has been reached',
        403
      );
    }

    if (
      !canCreateProduct(
        { plan: user.plan },
        productCount + source.products.length
      )
    ) {
      return createErrorResponse(
        ERROR_CODES.PLAN_LIMIT_REACHED,
        'Duplicating this category would exceed product limit for your plan',
        403
      );
    }

    const maxSort = await prisma.category.aggregate({
      where: { menuId },
      _max: { sortOrder: true },
    });

    const duplicated = await prisma.category.create({
      data: {
        menuId,
        nameKa: `${source.nameKa} (Copy)`,
        nameEn: source.nameEn ? `${source.nameEn} (Copy)` : null,
        nameRu: source.nameRu ? `${source.nameRu} (Copy)` : null,
        descriptionKa: source.descriptionKa,
        descriptionEn: source.descriptionEn,
        descriptionRu: source.descriptionRu,
        iconUrl: source.iconUrl,
        brandLabel: source.brandLabel,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        products: {
          create: source.products.map((p) => ({
            nameKa: p.nameKa,
            nameEn: p.nameEn,
            nameRu: p.nameRu,
            descriptionKa: p.descriptionKa,
            descriptionEn: p.descriptionEn,
            descriptionRu: p.descriptionRu,
            price: p.price,
            oldPrice: p.oldPrice,
            currency: p.currency,
            imageUrl: p.imageUrl,
            imageFocalX: p.imageFocalX,
            imageFocalY: p.imageFocalY,
            imageZoom: p.imageZoom,
            allergens: p.allergens,
            ribbons: p.ribbons,
            isVegan: p.isVegan,
            isVegetarian: p.isVegetarian,
            calories: p.calories,
            protein: p.protein,
            fats: p.fats,
            carbs: p.carbs,
            fiber: p.fiber,
            isAvailable: p.isAvailable,
            sortOrder: p.sortOrder,
            variations: {
              create: p.variations.map((v) => ({
                nameKa: v.nameKa,
                nameEn: v.nameEn,
                nameRu: v.nameRu,
                price: v.price,
                sortOrder: v.sortOrder,
              })),
            },
          })),
        },
      },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: { variations: { orderBy: { sortOrder: 'asc' } } },
        },
        _count: { select: { products: true } },
      },
    });

    await invalidateMenuCache(menuId, menu.slug);
    await triggerMenuEvent(menuId, EVENTS.CATEGORY_CREATED, duplicated);

    return createSuccessResponse(duplicated, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
