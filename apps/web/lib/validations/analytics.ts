import { z } from 'zod';

// Schema for tracking a menu view
export const trackViewSchema = z.object({
  userAgent: z.string().optional(),
  // Optional — when provided, the view is attributed to a specific category
  // (e.g. category tapped in the public menu nav). Extracted server-side from
  // headers, not from client, for userAgent.
  categoryId: z.string().optional(),
});

// Schema for analytics query parameters
export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  period: z.enum(['7d', '30d', '90d', 'custom']).default('30d'),
});

// Schema for analytics overview response
export const analyticsOverviewSchema = z.object({
  totalViews: z.number(),
  viewsToday: z.number(),
  viewsThisWeek: z.number(),
  viewsThisMonth: z.number(),
  averageDaily: z.number(),
});

// Schema for daily views data point
export const dailyViewSchema = z.object({
  date: z.string(),
  views: z.number(),
});

// Schema for device breakdown
export const deviceBreakdownSchema = z.object({
  device: z.string(),
  count: z.number(),
  percentage: z.number(),
});

// Schema for browser breakdown
export const browserBreakdownSchema = z.object({
  browser: z.string(),
  count: z.number(),
  percentage: z.number(),
});

// KPI deltas for the per-menu analytics tab (T15.1)
export const kpiTrendSchema = z.object({
  current: z.number(),
  previous: z.number(),
  deltaPercent: z.number(),
  daily: z.array(z.number()),
});

export const peakHourSchema = z.object({
  hour: z.number().int().min(0).max(23).nullable(),
  views: z.number(),
});

export const analyticsKpisSchema = z.object({
  totalViews: kpiTrendSchema,
  uniqueScans: kpiTrendSchema,
  avgTimeOnMenu: z.null(),
  peakHour: peakHourSchema,
});

// Chart event pin (T15.2) — surfaced from ActivityLog inside the analytics
// period. Type mirrors the Prisma ActivityType enum but kept as a string
// so client code doesn't need to import @prisma/client.
export const chartEventSchema = z.object({
  date: z.string(),
  type: z.enum(['MENU_PUBLISHED', 'PROMOTION_STARTED', 'PROMOTION_ENDED']),
  payload: z.record(z.string(), z.unknown()).default({}),
});

// T15.3 — top categories by MenuView count. `categoryId` is omitted when a
// view was not attributed to any category; such rows are filtered out of the
// aggregation before this payload is built.
export const topCategorySchema = z.object({
  categoryId: z.string(),
  nameKa: z.string(),
  nameEn: z.string().nullable(),
  nameRu: z.string().nullable(),
  count: z.number(),
  percentage: z.number(),
});

// Full analytics response schema
export const menuAnalyticsSchema = z.object({
  overview: analyticsOverviewSchema,
  kpis: analyticsKpisSchema,
  dailyViews: z.array(dailyViewSchema),
  events: z.array(chartEventSchema),
  deviceBreakdown: z.array(deviceBreakdownSchema),
  browserBreakdown: z.array(browserBreakdownSchema),
  topCategories: z.array(topCategorySchema),
});

export type TrackViewInput = z.infer<typeof trackViewSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
export type DailyView = z.infer<typeof dailyViewSchema>;
export type DeviceBreakdown = z.infer<typeof deviceBreakdownSchema>;
export type BrowserBreakdown = z.infer<typeof browserBreakdownSchema>;
export type KpiTrend = z.infer<typeof kpiTrendSchema>;
export type AnalyticsKpis = z.infer<typeof analyticsKpisSchema>;
export type PeakHour = z.infer<typeof peakHourSchema>;
export type ChartEvent = z.infer<typeof chartEventSchema>;
export type TopCategory = z.infer<typeof topCategorySchema>;
export type MenuAnalytics = z.infer<typeof menuAnalyticsSchema>;
