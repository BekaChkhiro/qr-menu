import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
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
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';
import { sanitizeMenuResponse } from '@/lib/menu-visibility';

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

    return createSuccessResponse(sanitizeMenuResponse(menu));
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
      select: {
        userId: true,
        slug: true,
        passwordHash: true,
        status: true,
        user: { select: { plan: true } },
      },
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

    // T19.7 — gate enabling shared tables behind PRO. Disabling is always allowed.
    if (data.sharedTableEnabled === true && existingMenu.user.plan !== 'PRO') {
      return createErrorResponse(
        ERROR_CODES.PLAN_REQUIRED,
        'Shared tables are a PRO feature. Upgrade to enable.',
        403
      );
    }

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

    // T15.13 — `visibility` + `password` are derived inputs that map onto
    // `status` + `passwordHash`. Strip them from the main patch and synthesize
    // the persisted fields here.
    const { visibility, password, ...patch } = data;
    const updatePayload: Record<string, unknown> = { ...patch };
    let visibilityChanged = false;

    if (visibility === 'PUBLISHED') {
      updatePayload.status = 'PUBLISHED';
      updatePayload.passwordHash = null;
      if (existingMenu.passwordHash) visibilityChanged = true;
      if (existingMenu.status !== 'PUBLISHED') {
        updatePayload.publishedAt = new Date();
        visibilityChanged = true;
      }
    } else if (visibility === 'PASSWORD_PROTECTED') {
      if (!password && !existingMenu.passwordHash) {
        return createErrorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          'A password is required to enable password protection',
          400
        );
      }
      updatePayload.status = 'PUBLISHED';
      if (password) {
        updatePayload.passwordHash = await bcrypt.hash(password, 10);
        visibilityChanged = true;
      }
      if (existingMenu.status !== 'PUBLISHED') {
        updatePayload.publishedAt = new Date();
        visibilityChanged = true;
      }
    } else if (visibility === 'PRIVATE_DRAFT') {
      updatePayload.status = 'DRAFT';
      updatePayload.passwordHash = null;
      if (existingMenu.status !== 'DRAFT' || existingMenu.passwordHash) {
        visibilityChanged = true;
      }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: updatePayload,
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
    if (visibilityChanged || data.slug) {
      await invalidateMenuCache(id, menu.slug);
    }

    const safeMenu = sanitizeMenuResponse(menu);

    // Broadcast real-time update
    await triggerMenuEvent(id, EVENTS.MENU_UPDATED, safeMenu);

    return createSuccessResponse(safeMenu);
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

    // Broadcast real-time update
    await triggerMenuEvent(id, EVENTS.MENU_DELETED, { id });

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
