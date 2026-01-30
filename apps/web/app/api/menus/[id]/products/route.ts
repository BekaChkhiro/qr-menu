import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  ERROR_CODES,
} from '@/lib/api';
import { createProductSchema, productQuerySchema } from '@/lib/validations';
import { canCreateProduct, hasFeature } from '@/lib/auth/permissions';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/menus/:id/products
 * List all products for a menu with optional filtering and pagination
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view products',
        401
      );
    }

    const { id: menuId } = await params;

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

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = productQuerySchema.parse(searchParams);

    // Build where clause
    const where: {
      category: { menuId: string };
      categoryId?: string;
      isAvailable?: boolean;
    } = {
      category: { menuId },
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Fetch products with pagination
    const products = await prisma.product.findMany({
      where,
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
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

    return createPaginatedResponse(products, {
      page: query.page,
      limit: query.limit,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/menus/:id/products
 * Create a new product in a menu
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to create a product',
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

    // Check plan limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    if (!user) {
      return createErrorResponse(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Count products across all categories in this menu
    const productCount = await prisma.product.count({
      where: {
        category: { menuId },
      },
    });

    if (!canCreateProduct(user, productCount)) {
      return createErrorResponse(
        ERROR_CODES.PLAN_LIMIT_REACHED,
        'You have reached the maximum number of products for your plan. Upgrade to add more products.',
        403
      );
    }

    // Validate request body
    const body = await request.json();
    const data = createProductSchema.parse(body);

    // Verify category exists and belongs to this menu
    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
        menuId,
      },
    });

    if (!category) {
      return createErrorResponse(
        ERROR_CODES.CATEGORY_NOT_FOUND,
        'Category not found or does not belong to this menu',
        400
      );
    }

    // Check allergens feature availability
    if (data.allergens && data.allergens.length > 0 && !hasFeature(user.plan, 'allergens')) {
      return createErrorResponse(
        ERROR_CODES.FEATURE_NOT_AVAILABLE,
        'Allergens feature is not available in your plan. Upgrade to PRO to use allergens.',
        403
      );
    }

    // If sortOrder not provided, put at the end of the category
    const sortOrder =
      data.sortOrder ??
      (await prisma.product.count({ where: { categoryId: data.categoryId } }));

    // Create product
    const product = await prisma.product.create({
      data: {
        ...data,
        sortOrder,
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

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_CREATED, product);

    return createSuccessResponse(product, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
