'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';

export type UserAnalyticsPeriod = '7d' | '30d' | '90d';

export type UserAnalyticsDevice = 'mobile' | 'desktop' | 'tablet' | 'other';

export interface UserAnalyticsResponse {
  overview: {
    totalViews: number;
    previousTotalViews: number;
    /** Percent delta vs. previous equal-length window. Rounded to 1dp. */
    deltaPercent: number;
  };
  dailyViews: Array<{ date: string; views: number }>;
  deviceBreakdown: Array<{
    device: UserAnalyticsDevice;
    count: number;
    percentage: number;
  }>;
  period: {
    period: UserAnalyticsPeriod;
    start: string;
    end: string;
    days: number;
  };
}

export function useUserAnalytics(period: UserAnalyticsPeriod) {
  return useQuery<UserAnalyticsResponse, ApiError>({
    queryKey: queryKeys.analytics.user(period),
    queryFn: () => api.get<UserAnalyticsResponse>(`/user/analytics?period=${period}`),
    staleTime: 1000 * 60 * 5,
  });
}
