'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { AnalyticsFilters } from '@/hooks/use-analytics';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsRangeValue {
  filters: AnalyticsFilters;
  setPreset: (period: '7d' | '30d' | '90d') => void;
  setCustom: (startDate: string, endDate: string) => void;
}

const DEFAULT_FILTERS: AnalyticsFilters = { period: '30d' };

const AnalyticsRangeContext = createContext<AnalyticsRangeValue | null>(null);

export function AnalyticsRangeProvider({
  children,
  initial = DEFAULT_FILTERS,
}: {
  children: ReactNode;
  initial?: AnalyticsFilters;
}) {
  const [filters, setFilters] = useState<AnalyticsFilters>(initial);

  const value = useMemo<AnalyticsRangeValue>(
    () => ({
      filters,
      setPreset: (period) => setFilters({ period }),
      setCustom: (startDate, endDate) =>
        setFilters({ period: 'custom', startDate, endDate }),
    }),
    [filters],
  );

  return (
    <AnalyticsRangeContext.Provider value={value}>
      {children}
    </AnalyticsRangeContext.Provider>
  );
}

/**
 * Read the active analytics range. Falls back to a 30d preset when no
 * provider is mounted so existing callers keep working without rewrites.
 */
export function useAnalyticsRange(): AnalyticsRangeValue {
  const ctx = useContext(AnalyticsRangeContext);
  if (ctx) return ctx;
  return {
    filters: DEFAULT_FILTERS,
    setPreset: () => {},
    setCustom: () => {},
  };
}

/**
 * Returns the number of days the active range covers. Used for delta
 * captions and "Last N days" subtitles.
 */
export function rangeDays(filters: AnalyticsFilters): number {
  if (filters.period === '7d') return 7;
  if (filters.period === '90d') return 90;
  if (filters.period === 'custom' && filters.startDate && filters.endDate) {
    const ms =
      new Date(filters.endDate).getTime() -
      new Date(filters.startDate).getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }
  return 30;
}
