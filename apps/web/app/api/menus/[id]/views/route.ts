import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { headers } from 'next/headers';
import { cacheGet, cacheSet, cacheDelete, CACHE_KEYS } from '@/lib/cache/redis';
import { trackViewSchema } from '@/lib/validations';

// Debounce window in seconds (15 minutes)
const VIEW_DEBOUNCE_SECONDS = 15 * 60;

// Generate a unique key for debouncing based on menu + IP + user agent hash
function getViewDebounceKey(menuId: string, ipAddress?: string, userAgent?: string): string {
  // Create a simple hash from user agent to keep key short
  const uaHash = userAgent
    ? Buffer.from(userAgent).toString('base64').slice(0, 16)
    : 'unknown';
  const ip = ipAddress || 'unknown';
  return `view:debounce:${menuId}:${ip}:${uaHash}`;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/menus/:id/views
 * Track a view for a menu (called from public menu page)
 * This endpoint is public - no authentication required
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const headersList = await headers();

    // Verify the menu exists and is published
    const menu = await prisma.menu.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!menu) {
      return createErrorResponse(
        ERROR_CODES.MENU_NOT_FOUND,
        'Menu not found',
        404
      );
    }

    // Only track views for published menus
    if (menu.status !== 'PUBLISHED') {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Cannot track views for unpublished menus',
        403
      );
    }

    // Optional body: { categoryId? } — categoryId attributes the view to a
    // specific category (e.g. tap on a category nav pill). Body is optional so
    // existing callers that POST with empty bodies keep working.
    let categoryId: string | undefined;
    try {
      const raw = await request.text();
      if (raw.length > 0) {
        const parsed = trackViewSchema.parse(JSON.parse(raw));
        categoryId = parsed.categoryId;
      }
    } catch {
      // Malformed body is non-fatal — menu-level tracking continues.
    }

    if (categoryId) {
      // Guard: categoryId must belong to this menu. Prevents cross-menu
      // attribution when a caller posts a random id.
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { menuId: true },
      });
      if (!cat || cat.menuId !== id) {
        categoryId = undefined;
      }
    }

    // Extract tracking data from headers
    const userAgent = headersList.get('user-agent') || undefined;
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || undefined;

    // Check for debounce - prevent duplicate views from same user within time window
    const debounceKey = getViewDebounceKey(id, ipAddress, userAgent);
    const recentView = await cacheGet<boolean>(debounceKey);

    if (recentView) {
      // Already tracked a view from this user recently
      return createSuccessResponse({ tracked: false, reason: 'debounced' }, 200);
    }

    // Parse user agent for device and browser info
    let device: string | undefined;
    let browser: string | undefined;

    if (userAgent) {
      // Simple device detection based on user agent
      const ua = userAgent.toLowerCase();
      if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        if (/tablet|ipad/i.test(ua)) {
          device = 'tablet';
        } else {
          device = 'mobile';
        }
      } else {
        device = 'desktop';
      }

      // Simple browser detection
      if (ua.includes('chrome') && !ua.includes('edg')) {
        browser = 'Chrome';
      } else if (ua.includes('safari') && !ua.includes('chrome')) {
        browser = 'Safari';
      } else if (ua.includes('firefox')) {
        browser = 'Firefox';
      } else if (ua.includes('edg')) {
        browser = 'Edge';
      } else if (ua.includes('opera') || ua.includes('opr')) {
        browser = 'Opera';
      } else {
        browser = 'Other';
      }
    }

    // Create the view record
    const view = await prisma.menuView.create({
      data: {
        menuId: id,
        categoryId,
        userAgent,
        ipAddress,
        device,
        browser,
      },
    });

    // Set debounce flag to prevent duplicate views
    await cacheSet(debounceKey, true, VIEW_DEBOUNCE_SECONDS);

    // Invalidate analytics cache for this menu (so dashboard shows updated counts)
    const today = new Date().toISOString().split('T')[0];
    await cacheDelete(CACHE_KEYS.analytics(id, today));

    return createSuccessResponse({ tracked: true, viewId: view.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
