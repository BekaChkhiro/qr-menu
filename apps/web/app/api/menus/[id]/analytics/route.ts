import { NextRequest } from 'next/server';
import { ActivityType, Prisma } from '@prisma/client';
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
  differenceInCalendarDays,
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

    // ── T15.3 Top categories ──────────────────────────────────────────────
    // Views attributed to a specific category (categoryId not null). Rows
    // without attribution (the default menu-page view) are excluded so the
    // bars only reflect real category-level engagement.
    const topCategoriesRaw = await prisma.menuView.groupBy({
      by: ['categoryId'],
      where: {
        menuId: id,
        categoryId: { not: null },
        viewedAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topCategoryIds = topCategoriesRaw
      .map((row) => row.categoryId)
      .filter((v): v is string => v !== null);

    const topCategoryRows = topCategoryIds.length
      ? await prisma.category.findMany({
          where: { id: { in: topCategoryIds } },
          select: { id: true, nameKa: true, nameEn: true, nameRu: true },
        })
      : [];

    const topCategoryById = new Map(topCategoryRows.map((c) => [c.id, c]));

    // Percentage denominator is total categorized views in the period, not
    // total menu views — keeps bar lengths meaningful when only a subset of
    // traffic is attributed.
    const totalCategorizedViews = topCategoriesRaw.reduce(
      (sum, row) => sum + row._count.id,
      0,
    );

    const topCategories = topCategoriesRaw
      .map((row) => {
        const cat = row.categoryId
          ? topCategoryById.get(row.categoryId)
          : undefined;
        if (!row.categoryId || !cat) return null;
        const count = row._count.id;
        const percentage =
          totalCategorizedViews > 0
            ? Math.round((count / totalCategorizedViews) * 1000) / 10
            : 0;
        return {
          categoryId: row.categoryId,
          nameKa: cat.nameKa,
          nameEn: cat.nameEn,
          nameRu: cat.nameRu,
          count,
          percentage,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    // ── T15.1 KPI row aggregates ──────────────────────────────────────────
    // Previous equal-length window for delta calculation.
    const periodDays = dailyViews.length;
    const prevEnd = endOfDay(subDays(startDate, 1));
    const prevStart = startOfDay(subDays(prevEnd, periodDays - 1));

    // Views in current + previous window, needed for delta on "Total views".
    const [totalViewsInPeriod, previousTotalViews] = await Promise.all([
      prisma.menuView.count({
        where: { menuId: id, viewedAt: { gte: startDate, lte: endDate } },
      }),
      prisma.menuView.count({
        where: { menuId: id, viewedAt: { gte: prevStart, lte: prevEnd } },
      }),
    ]);

    // Unique scans: COUNT(DISTINCT (ipAddress || userAgent)) per period.
    // Raw SQL — no efficient Prisma equivalent for COUNT(DISTINCT compound).
    type UniqueScanRow = { count: bigint };
    const [uniqueScansRows, previousUniqueScansRows] = await Promise.all([
      prisma.$queryRaw<UniqueScanRow[]>(Prisma.sql`
        SELECT COUNT(DISTINCT COALESCE("ipAddress", '') || '|' || COALESCE("userAgent", '')) AS count
        FROM "menu_views"
        WHERE "menuId" = ${id}
          AND "viewedAt" >= ${startDate}
          AND "viewedAt" <= ${endDate}
      `),
      prisma.$queryRaw<UniqueScanRow[]>(Prisma.sql`
        SELECT COUNT(DISTINCT COALESCE("ipAddress", '') || '|' || COALESCE("userAgent", '')) AS count
        FROM "menu_views"
        WHERE "menuId" = ${id}
          AND "viewedAt" >= ${prevStart}
          AND "viewedAt" <= ${prevEnd}
      `),
    ]);
    const uniqueScans = Number(uniqueScansRows[0]?.count ?? 0);
    const previousUniqueScans = Number(previousUniqueScansRows[0]?.count ?? 0);

    // Daily unique-scan counts for the sparkline.
    type DailyUniqueRow = { day: Date; count: bigint };
    const dailyUniqueRaw = await prisma.$queryRaw<DailyUniqueRow[]>(Prisma.sql`
      SELECT DATE_TRUNC('day', "viewedAt") AS day,
             COUNT(DISTINCT COALESCE("ipAddress", '') || '|' || COALESCE("userAgent", '')) AS count
      FROM "menu_views"
      WHERE "menuId" = ${id}
        AND "viewedAt" >= ${startDate}
        AND "viewedAt" <= ${endDate}
      GROUP BY day
      ORDER BY day ASC
    `);
    const uniqueByDay = new Map<string, number>();
    for (const row of dailyUniqueRaw) {
      uniqueByDay.set(format(row.day, 'yyyy-MM-dd'), Number(row.count));
    }
    const uniqueScansDaily = allDates.map(
      (date) => uniqueByDay.get(format(date, 'yyyy-MM-dd')) ?? 0,
    );

    // Peak hour aggregation. `viewedAt` is stored as `timestamp` (no tz) with
    // UTC values by Prisma convention, so EXTRACT directly returns the UTC
    // hour — no `AT TIME ZONE` wrapping (which would shift on non-UTC servers).
    type PeakHourRow = { hour: number; count: bigint };
    const peakHourRows = await prisma.$queryRaw<PeakHourRow[]>(Prisma.sql`
      SELECT CAST(EXTRACT(HOUR FROM "viewedAt") AS INTEGER) AS hour,
             COUNT(*) AS count
      FROM "menu_views"
      WHERE "menuId" = ${id}
        AND "viewedAt" >= ${startDate}
        AND "viewedAt" <= ${endDate}
      GROUP BY hour
      ORDER BY count DESC, hour ASC
      LIMIT 1
    `);
    const peakHour =
      peakHourRows.length > 0
        ? { hour: peakHourRows[0].hour, views: Number(peakHourRows[0].count) }
        : { hour: null, views: 0 };

    // T15.2 — chart event pins. Pull ActivityLog rows for this menu inside
    // the period so the chart can mark "Menu published / Promotion started /
    // ended" along the X-axis. Anything older than the period is ignored.
    const chartEventTypes: ActivityType[] = [
      ActivityType.MENU_PUBLISHED,
      ActivityType.PROMOTION_STARTED,
      ActivityType.PROMOTION_ENDED,
    ];
    const eventRows = await prisma.activityLog.findMany({
      where: {
        menuId: id,
        type: { in: chartEventTypes },
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
      select: { type: true, createdAt: true, payload: true },
    });
    const events = eventRows.map((row) => ({
      date: format(row.createdAt, 'yyyy-MM-dd'),
      type: row.type,
      payload: (row.payload ?? {}) as Record<string, unknown>,
    }));

    function deltaPercent(current: number, previous: number): number {
      if (previous === 0) {
        return current === 0 ? 0 : 100;
      }
      return Math.round(((current - previous) / previous) * 1000) / 10;
    }

    return createSuccessResponse({
      overview: {
        totalViews,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        averageDaily,
      },
      kpis: {
        totalViews: {
          current: totalViewsInPeriod,
          previous: previousTotalViews,
          deltaPercent: deltaPercent(totalViewsInPeriod, previousTotalViews),
          daily: dailyViews.map((d) => d.views),
        },
        uniqueScans: {
          current: uniqueScans,
          previous: previousUniqueScans,
          deltaPercent: deltaPercent(uniqueScans, previousUniqueScans),
          daily: uniqueScansDaily,
        },
        avgTimeOnMenu: null,
        peakHour,
      },
      dailyViews,
      events,
      deviceBreakdown,
      browserBreakdown,
      topCategories,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
        days: differenceInCalendarDays(endDate, startDate) + 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
