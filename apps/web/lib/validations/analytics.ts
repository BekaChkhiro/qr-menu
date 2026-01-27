import { z } from 'zod';

// Schema for tracking a menu view
export const trackViewSchema = z.object({
  userAgent: z.string().optional(),
  // These are extracted server-side from headers, not from client
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

// Full analytics response schema
export const menuAnalyticsSchema = z.object({
  overview: analyticsOverviewSchema,
  dailyViews: z.array(dailyViewSchema),
  deviceBreakdown: z.array(deviceBreakdownSchema),
  browserBreakdown: z.array(browserBreakdownSchema),
});

export type TrackViewInput = z.infer<typeof trackViewSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
export type DailyView = z.infer<typeof dailyViewSchema>;
export type DeviceBreakdown = z.infer<typeof deviceBreakdownSchema>;
export type BrowserBreakdown = z.infer<typeof browserBreakdownSchema>;
export type MenuAnalytics = z.infer<typeof menuAnalyticsSchema>;
