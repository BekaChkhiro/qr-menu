import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { updateMenuSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/menus/:id
 * Get a specific menu by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view this menu',
        401
      );
    }

    const { id } = await params;

    const menu = await prisma.menu.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              orderBy: { sortOrder: 'asc' },
              include: {
                variations: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        promotions: {
          where: {
            isActive: true,
            endDate: { gte: new Date() },
          },
          orderBy: { startDate: 'asc' },
        },
        _count: {
          select: {
            categories: true,
            views: true,
          },
        },
      },
    });

    if (!menu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    return createSuccessResponse(menu);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/menus/:id
 * Update a menu
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to update this menu',
        401
      );
    }

    const { id } = await params;

    // Check ownership
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
      select: { userId: true, slug: true },
    });

    if (!existingMenu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    if (existingMenu.userId !== session.user.id) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to update this menu',
        403
      );
    }

    const body = await request.json();
    const data = updateMenuSchema.parse(body);

    // If slug is being changed, check if new slug is available
    if (data.slug && data.slug !== existingMenu.slug) {
      const slugTaken = await prisma.menu.findUnique({
        where: { slug: data.slug },
      });

      if (slugTaken) {
        return createErrorResponse(
          ERROR_CODES.SLUG_EXISTS,
          'A menu with this slug already exists. Please choose a different slug.',
          409
        );
      }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            categories: true,
            views: true,
          },
        },
      },
    });

    // Invalidate cache for the old slug (if changed) and new slug
    if (data.slug && data.slug !== existingMenu.slug) {
      await invalidateMenuCache(id, existingMenu.slug);
    }
    await invalidateMenuCache(id, menu.slug);

    return createSuccessResponse(menu);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/menus/:id
 * Delete a menu
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to delete this menu',
        401
      );
    }

    const { id } = await params;

    // Check ownership
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
      select: { userId: true, slug: true },
    });

    if (!existingMenu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    if (existingMenu.userId !== session.user.id) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to delete this menu',
        403
      );
    }

    // Delete menu (cascades to categories, products, etc.)
    await prisma.menu.delete({
      where: { id },
    });

    // Invalidate cache
    await invalidateMenuCache(id, existingMenu.slug);

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
