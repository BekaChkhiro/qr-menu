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
import { createMenuSchema, menuQuerySchema } from '@/lib/validations';
import { canCreateMenu } from '@/lib/auth/permissions';

/**
 * GET /api/menus
 * List all menus for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view menus',
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const query = menuQuerySchema.parse({
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 10,
      status: searchParams.get('status') ?? undefined,
    });

    const where = {
      userId: session.user.id,
      ...(query.status && { status: query.status }),
    };

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              categories: true,
              views: true,
            },
          },
        },
      }),
      prisma.menu.count({ where }),
    ]);

    return createPaginatedResponse(menus, {
      page: query.page,
      limit: query.limit,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/menus
 * Create a new menu
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to create a menu',
        401
      );
    }

    // Check plan limits
    const userWithMenus = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: { menus: true },
        },
      },
    });

    if (!userWithMenus) {
      return createErrorResponse(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    if (!canCreateMenu(userWithMenus)) {
      return createErrorResponse(
        ERROR_CODES.PLAN_LIMIT_REACHED,
        `You have reached the maximum number of menus for your plan. Please upgrade to create more menus.`,
        403
      );
    }

    const body = await request.json();
    const data = createMenuSchema.parse(body);

    // Check if slug is already taken
    const existingMenu = await prisma.menu.findUnique({
      where: { slug: data.slug },
    });

    if (existingMenu) {
      return createErrorResponse(
        ERROR_CODES.SLUG_EXISTS,
        'A menu with this slug already exists. Please choose a different slug.',
        409
      );
    }

    const menu = await prisma.menu.create({
      data: {
        ...data,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            categories: true,
            views: true,
          },
        },
      },
    });

    return createSuccessResponse(menu, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
