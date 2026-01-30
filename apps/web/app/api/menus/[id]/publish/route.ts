import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { publishMenuSchema } from '@/lib/validations';
import { invalidateMenuCache, cacheSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/menus/:id/publish
 * Publish or unpublish a menu
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to publish this menu',
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
        status: true,
        _count: {
          select: { categories: true },
        },
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
        'You do not have permission to publish this menu',
        403
      );
    }

    const body = await request.json();
    const { publish } = publishMenuSchema.parse(body);

    // If publishing, validate menu has at least one category
    if (publish && existingMenu._count.categories === 0) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Cannot publish a menu without any categories. Please add at least one category first.',
        400
      );
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        status: publish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: publish ? new Date() : null,
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

    // Handle caching
    if (publish) {
      // Cache the published menu for public access
      await cacheSet(
        CACHE_KEYS.publicMenu(menu.slug),
        menu,
        CACHE_TTL.PUBLIC_MENU
      );
    } else {
      // Invalidate cache when unpublishing
      await invalidateMenuCache(id, menu.slug);
    }

    // Broadcast real-time update
    await triggerMenuEvent(
      id,
      publish ? EVENTS.MENU_PUBLISHED : EVENTS.MENU_UNPUBLISHED,
      menu
    );

    return createSuccessResponse(menu);
  } catch (error) {
    return handleApiError(error);
  }
}
