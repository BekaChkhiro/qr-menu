import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import {
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
  handleApiError,
} from '@/lib/api';
import {
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  subDays,
} from 'date-fns';

// GET /api/user/analytics?period=7d|30d|90d
//
// Aggregates MenuView rows across all menus owned by the current user and
// returns the shape the dashboard Analytics + Device cards consume.
//
// The endpoint itself does not gate on plan — the UI blurs the chart for FREE
// so the overlay keeps the card's physical footprint stable. Gating happens
// client-side; the query still runs so PRO/STARTER get live data.

const PERIOD_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
} as const;

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
});

// Normalize the free-form `device` column to one of four buckets that match
// the donut legend. The public view-tracker stores lowercase `mobile` |
// `desktop` | `tablet`, but older rows or non-browser agents can land here
// with `null` or other labels.
function normalizeDevice(raw: string | null): 'mobile' | 'desktop' | 'tablet' | 'other' {
  if (!raw) return 'other';
  const v = raw.trim().toLowerCase();
  if (v === 'mobile' || v === 'desktop' || v === 'tablet') return v;
  return 'other';
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'You must be logged in to view analytics',
        401,
      );
    }

    const { searchParams } = new URL(request.url);
    const { period } = querySchema.parse({
      period: searchParams.get('period') ?? '30d',
    });

    const days = PERIOD_DAYS[period];
    const now = new Date();
    const endDate = endOfDay(now);
    const startDate = startOfDay(subDays(now, days - 1));
    const prevEndDate = endOfDay(subDays(startDate, 1));
    const prevStartDate = startOfDay(subDays(startDate, days));

    const userId = session.user.id;

    const [
      currentRows,
      prevViews,
      deviceRows,
    ] = await Promise.all([
      // Raw rows for the period — we need `viewedAt` + `device` both, which
      // groupBy can't return together. Projection keeps this cheap even at
      // scale; the existing index `(menuId, viewedAt)` plus the menu filter
      // means it stays a bounded range scan.
      prisma.menuView.findMany({
        where: {
          menu: { userId },
          viewedAt: { gte: startDate, lte: endDate },
        },
        select: { viewedAt: true, device: true },
      }),
      // Previous-period total — count only; used for the delta badge.
      prisma.menuView.count({
        where: {
          menu: { userId },
          viewedAt: { gte: prevStartDate, lte: prevEndDate },
        },
      }),
      // Separate device groupBy lets Postgres aggregate without us shipping
      // rows twice — but we still compute percentages from currentRows for
      // consistency with the daily total.
      prisma.menuView.groupBy({
        by: ['device'],
        where: {
          menu: { userId },
          viewedAt: { gte: startDate, lte: endDate },
        },
        _count: { _all: true },
      }),
    ]);

    // Daily buckets — include zero days so the chart always renders `days`
    // points and the x-axis is stable across refetches.
    const viewsMap = new Map<string, number>();
    for (const row of currentRows) {
      const key = format(row.viewedAt, 'yyyy-MM-dd');
      viewsMap.set(key, (viewsMap.get(key) ?? 0) + 1);
    }

    const dailyViews = eachDayOfInterval({ start: startDate, end: endDate }).map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      return { date: key, views: viewsMap.get(key) ?? 0 };
    });

    const totalViews = currentRows.length;
    const deltaPercent =
      prevViews === 0
        ? totalViews === 0
          ? 0
          : 100
        : Math.round(((totalViews - prevViews) / prevViews) * 1000) / 10;

    // Device buckets — always emit the three canonical rows (mobile/desktop/
    // tablet) even when empty so the donut + legend layout is stable. "Other"
    // only appears when there's data for it.
    const bucketCounts: Record<'mobile' | 'desktop' | 'tablet' | 'other', number> = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0,
    };
    for (const r of deviceRows) {
      const bucket = normalizeDevice(r.device);
      bucketCounts[bucket] += r._count._all;
    }
    const deviceTotal =
      bucketCounts.mobile + bucketCounts.desktop + bucketCounts.tablet + bucketCounts.other;
    const deviceBreakdown = (['mobile', 'desktop', 'tablet', 'other'] as const)
      .filter((b) => b !== 'other' || bucketCounts.other > 0)
      .map((b) => ({
        device: b,
        count: bucketCounts[b],
        percentage:
          deviceTotal > 0
            ? Math.round((bucketCounts[b] / deviceTotal) * 1000) / 10
            : 0,
      }));

    return createSuccessResponse({
      overview: {
        totalViews,
        previousTotalViews: prevViews,
        deltaPercent,
      },
      dailyViews,
      deviceBreakdown,
      period: {
        period,
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
        days,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
