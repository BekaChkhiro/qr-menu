'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import type {
  MenuAnalytics,
  AnalyticsOverview,
  DailyView,
  DeviceBreakdown,
  BrowserBreakdown,
} from '@/lib/validations/analytics';

export interface AnalyticsFilters {
  period?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsResponse extends MenuAnalytics {
  period: {
    start: string;
    end: string;
    days: number;
  };
}

/**
 * Hook to fetch analytics for a menu
 */
export function useMenuAnalytics(
  menuId: string | undefined,
  filters?: AnalyticsFilters
) {
  const queryParams = new URLSearchParams();
  if (filters?.period) queryParams.set('period', filters.period);
  if (filters?.startDate) queryParams.set('startDate', filters.startDate);
  if (filters?.endDate) queryParams.set('endDate', filters.endDate);

  const queryString = queryParams.toString();
  const endpoint = `/menus/${menuId}/analytics${queryString ? `?${queryString}` : ''}`;

  return useQuery<AnalyticsResponse, ApiError>({
    queryKey: filters?.startDate && filters?.endDate
      ? queryKeys.analytics.menuRange(menuId!, filters.startDate, filters.endDate)
      : queryKeys.analytics.menu(menuId!),
    queryFn: () => api.get<AnalyticsResponse>(endpoint),
    enabled: !!menuId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to track a menu view (called from public menu page)
 */
export function useTrackMenuView(menuId: string | undefined) {
  return useMutation<{ tracked: boolean; viewId: string }, ApiError, void>({
    mutationFn: () => api.post(`/menus/${menuId}/views`, {}),
  });
}

// Re-export types for convenience
export type {
  MenuAnalytics,
  AnalyticsOverview,
  DailyView,
  DeviceBreakdown,
  BrowserBreakdown,
};
