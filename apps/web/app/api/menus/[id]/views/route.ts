import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { headers } from 'next/headers';

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

    // Extract tracking data from headers
    const userAgent = headersList.get('user-agent') || undefined;
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || undefined;

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
        userAgent,
        ipAddress,
        device,
        browser,
      },
    });

    return createSuccessResponse({ tracked: true, viewId: view.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
