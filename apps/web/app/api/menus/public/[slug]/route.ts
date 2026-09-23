import { NextRequest } from 'next/server';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { getPublicMenu, filterComboProducts, livePromotions, type SerializedPublicMenu } from '@/lib/public-menu';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/menus/public/:slug
 * Get a published menu by slug (public access, cached)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Use the same cached shape as the public/preview pages.
    const menu = await getPublicMenu(slug);

    if (!menu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found or not published',
        404
      );
    }

    const { passwordHash: _passwordHash, ...publicMenu } = menu;
    void _passwordHash;
    const now = new Date();
    const visibleMenu = filterComboProducts(
      JSON.parse(JSON.stringify(publicMenu)) as SerializedPublicMenu,
      now,
    );
    return createSuccessResponse({
      ...visibleMenu,
      promotions: livePromotions(visibleMenu, now),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
