import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { createCategorySchema } from '@/lib/validations';
import { canCreateCategory } from '@/lib/auth/permissions';
import { invalidateMenuCache } from '@/lib/cache/redis';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/menus/:id/categories
 * List all categories for a menu
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view categories',
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

    // Fetch categories with product counts
    const categories = await prisma.category.findMany({
      where: { menuId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return createSuccessResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/menus/:id/categories
 * Create a new category in a menu
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to create a category',
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

    const categoryCount = await prisma.category.count({
      where: { menuId },
    });

    if (!canCreateCategory(user, categoryCount)) {
      return createErrorResponse(
        ERROR_CODES.PLAN_LIMIT_REACHED,
        'You have reached the maximum number of categories for your plan. Upgrade to add more categories.',
        403
      );
    }

    // Validate request body
    const body = await request.json();
    const data = createCategorySchema.parse(body);

    // If sortOrder not provided, put at the end
    const sortOrder =
      data.sortOrder ??
      (await prisma.category.count({ where: { menuId } }));

    // Create category
    const category = await prisma.category.create({
      data: {
        ...data,
        sortOrder,
        menuId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    return createSuccessResponse(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
