import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updateCategorySchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';

interface RouteParams {
  params: Promise<{ id: string; cid: string }>;
}

/**
 * GET /api/menus/:id/categories/:cid
 * Get a specific category
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view this category',
        401
      );
    }

    const { id: menuId, cid: categoryId } = await params;

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

    // Fetch category with products
    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
        menuId, // Ensure category belongs to the specified menu
      },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: {
            variations: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return createErrorResponse(
        ERROR_CODES.CATEGORY_NOT_FOUND,
        'Category not found',
        404
      );
    }

    return createSuccessResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/menus/:id/categories/:cid
 * Update a category
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update this category',
        401
      );
    }

    const { id: menuId, cid: categoryId } = await params;

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

    // Verify category exists and belongs to this menu
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: categoryId,
        menuId,
      },
    });

    if (!existingCategory) {
      return createErrorResponse(
        ERROR_CODES.CATEGORY_NOT_FOUND,
        'Category not found',
        404
      );
    }

    // Validate request body
    const body = await request.json();
    const data = updateCategorySchema.parse(body);

    // Update category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    return createSuccessResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/menus/:id/categories/:cid
 * Delete a category
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to delete this category',
        401
      );
    }

    const { id: menuId, cid: categoryId } = await params;

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

    // Verify category exists and belongs to this menu
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: categoryId,
        menuId,
      },
    });

    if (!existingCategory) {
      return createErrorResponse(
        ERROR_CODES.CATEGORY_NOT_FOUND,
        'Category not found',
        404
      );
    }

    // Delete category (products will cascade delete)
    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
