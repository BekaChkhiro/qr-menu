import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { createProductVariationSchema } from '@/lib/validations';
import { invalidateMenuCache } from '@/lib/cache/redis';
import { triggerMenuEvent, EVENTS } from '@/lib/pusher/server';

interface RouteParams {
  params: Promise<{ id: string; pid: string }>;
}

/**
 * GET /api/menus/:id/products/:pid/variations
 * List all variations for a product
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view variations',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

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

    // Verify product exists and belongs to this menu
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
    });

    if (!product) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Fetch variations
    const variations = await prisma.productVariation.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    return createSuccessResponse(variations);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/menus/:id/products/:pid/variations
 * Create a new variation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to create a variation',
        401
      );
    }

    const { id: menuId, pid: productId } = await params;

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

    // Verify product exists and belongs to this menu
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        category: { menuId },
      },
    });

    if (!product) {
      return createErrorResponse(
        ERROR_CODES.PRODUCT_NOT_FOUND,
        'Product not found',
        404
      );
    }

    // Validate request body
    const body = await request.json();
    const data = createProductVariationSchema.parse(body);

    // Get the max sortOrder for this product
    const maxSortOrder = await prisma.productVariation.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    // Create variation
    const variation = await prisma.productVariation.create({
      data: {
        ...data,
        productId,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      },
    });

    // Invalidate cache
    await invalidateMenuCache(menuId, menu.slug);

    // Broadcast real-time update
    await triggerMenuEvent(menuId, EVENTS.PRODUCT_UPDATED, { id: productId });

    return createSuccessResponse(variation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
