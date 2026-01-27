import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
} from '@/lib/api';
import { analyticsQuerySchema } from '@/lib/validations';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  startOfMonth,
  format,
  eachDayOfInterval,
} from 'date-fns';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/menus/:id/analytics
 * Get analytics data for a menu
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view analytics',
        401
      );
    }

    const { id } = await params;

    // Verify menu ownership
    const menu = await prisma.menu.findUnique({
      where: { id },
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
        'You do not have permission to view analytics for this menu',
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = analyticsQuerySchema.parse({
      period: searchParams.get('period') || '30d',
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (queryParams.period) {
      case '7d':
        startDate = startOfDay(subDays(now, 6));
        break;
      case '30d':
        startDate = startOfDay(subDays(now, 29));
        break;
      case '90d':
        startDate = startOfDay(subDays(now, 89));
        break;
      case 'custom':
        startDate = queryParams.startDate
          ? startOfDay(queryParams.startDate)
          : startOfDay(subDays(now, 29));
        endDate = queryParams.endDate
          ? endOfDay(queryParams.endDate)
          : endOfDay(now);
        break;
      default:
        startDate = startOfDay(subDays(now, 29));
    }

    // Get overview statistics
    const [totalViews, viewsToday, viewsThisWeek, viewsThisMonth] =
      await Promise.all([
        // Total views (all time)
        prisma.menuView.count({
          where: { menuId: id },
        }),

        // Views today
        prisma.menuView.count({
          where: {
            menuId: id,
            viewedAt: {
              gte: startOfDay(now),
              lte: endOfDay(now),
            },
          },
        }),

        // Views this week
        prisma.menuView.count({
          where: {
            menuId: id,
            viewedAt: {
              gte: startOfWeek(now, { weekStartsOn: 1 }),
              lte: endOfDay(now),
            },
          },
        }),

        // Views this month
        prisma.menuView.count({
          where: {
            menuId: id,
            viewedAt: {
              gte: startOfMonth(now),
              lte: endOfDay(now),
            },
          },
        }),
      ]);

    // Get daily views for the selected period
    const dailyViewsRaw = await prisma.menuView.groupBy({
      by: ['viewedAt'],
      where: {
        menuId: id,
        viewedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Create a map of dates to view counts
    const viewsMap = new Map<string, number>();

    // Aggregate views by day (since viewedAt includes time)
    dailyViewsRaw.forEach((item) => {
      const dateKey = format(item.viewedAt, 'yyyy-MM-dd');
      const currentCount = viewsMap.get(dateKey) || 0;
      viewsMap.set(dateKey, currentCount + item._count.id);
    });

    // Generate all dates in the range and fill in zeros for missing days
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyViews = allDates.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        date: dateKey,
        views: viewsMap.get(dateKey) || 0,
      };
    });

    // Calculate average daily views
    const totalViewsInRange = dailyViews.reduce((sum, day) => sum + day.views, 0);
    const averageDaily = Math.round((totalViewsInRange / dailyViews.length) * 10) / 10;

    // Get device breakdown
    const deviceBreakdownRaw = await prisma.menuView.groupBy({
      by: ['device'],
      where: {
        menuId: id,
        viewedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const deviceBreakdown = deviceBreakdownRaw.map((item) => ({
      device: item.device || 'Unknown',
      count: item._count.id,
      percentage:
        totalViewsInRange > 0
          ? Math.round((item._count.id / totalViewsInRange) * 1000) / 10
          : 0,
    }));

    // Get browser breakdown
    const browserBreakdownRaw = await prisma.menuView.groupBy({
      by: ['browser'],
      where: {
        menuId: id,
        viewedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10, // Top 10 browsers
    });

    const browserBreakdown = browserBreakdownRaw.map((item) => ({
      browser: item.browser || 'Unknown',
      count: item._count.id,
      percentage:
        totalViewsInRange > 0
          ? Math.round((item._count.id / totalViewsInRange) * 1000) / 10
          : 0,
    }));

    return createSuccessResponse({
      overview: {
        totalViews,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        averageDaily,
      },
      dailyViews,
      deviceBreakdown,
      browserBreakdown,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
        days: dailyViews.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
