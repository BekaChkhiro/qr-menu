'use client';

import { useTranslations } from 'next-intl';

import { StatCard, type StatCardTone } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMenuAnalytics } from '@/hooks/use-analytics';
import type { AnalyticsKpis, PeakHour } from '@/lib/validations/analytics';
import { rangeDays, useAnalyticsRange } from './analytics-range-context';

interface AnalyticsKpisProps {
  menuId: string;
  hasAnalytics: boolean;
}

function formatNumber(n: number, locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

function formatHour(peak: PeakHour): string {
  if (peak.hour === null) return '—';
  return `${peak.hour.toString().padStart(2, '0')}:00`;
}

function toneForDelta(deltaPercent: number): StatCardTone {
  if (deltaPercent > 0) return 'up';
  if (deltaPercent < 0) return 'down';
  return 'flat';
}

export function AnalyticsKpis({ menuId, hasAnalytics }: AnalyticsKpisProps) {
  const t = useTranslations('admin.editor.analytics');
  const { filters } = useAnalyticsRange();
  const { data, isLoading } = useMenuAnalytics(menuId, filters);
  const periodDays = rangeDays(filters);

  if (isLoading) {
    return <KpisSkeleton />;
  }

  const kpis: AnalyticsKpis | undefined = data?.kpis;

  const totalViewsTone = toneForDelta(kpis?.totalViews.deltaPercent ?? 0);
  const uniqueScansTone = toneForDelta(kpis?.uniqueScans.deltaPercent ?? 0);

  const totalViewsDelta = formatDeltaLabel(
    kpis?.totalViews.deltaPercent ?? 0,
    t,
    periodDays,
  );
  const uniqueScansDelta = formatDeltaLabel(
    kpis?.uniqueScans.deltaPercent ?? 0,
    t,
    periodDays,
  );
  const peakHourCaption =
    kpis && kpis.peakHour.views > 0
      ? t('kpis.peakHourCaption', { views: kpis.peakHour.views })
      : t('kpis.noDataCaption');

  const avgTimeNoData = t('kpis.noDataCaption');
  const noDataValue = t('kpis.noData');

  return (
    <section
      data-testid="editor-analytics-kpis"
      data-plan-locked={hasAnalytics ? 'false' : 'true'}
      aria-labelledby="editor-analytics-kpis-title"
      className="relative"
    >
      <h2 id="editor-analytics-kpis-title" className="sr-only">
        {t('kpis.totalViews')}
      </h2>

      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2 xl:grid-cols-4',
          !hasAnalytics && 'pointer-events-none select-none opacity-55 blur-[6px]',
        )}
        aria-hidden={hasAnalytics ? undefined : true}
      >
        <StatCard
          data-testid="kpi-total-views"
          label={t('kpis.totalViews')}
          value={formatNumber(kpis?.totalViews.current ?? 0)}
          delta={totalViewsDelta}
          tone={totalViewsTone}
          sparkline={kpis?.totalViews.daily ?? []}
        />
        <StatCard
          data-testid="kpi-unique-scans"
          label={t('kpis.uniqueScans')}
          value={formatNumber(kpis?.uniqueScans.current ?? 0)}
          delta={uniqueScansDelta}
          tone={uniqueScansTone}
          sparkline={kpis?.uniqueScans.daily ?? []}
        />
        <StatCard
          data-testid="kpi-avg-time"
          label={t('kpis.avgTimeOnMenu')}
          value={noDataValue}
          delta={avgTimeNoData}
          tone="flat"
        />
        <StatCard
          data-testid="kpi-peak-hour"
          label={t('kpis.peakHour')}
          value={kpis ? formatHour(kpis.peakHour) : noDataValue}
          delta={peakHourCaption}
          tone="flat"
        />
      </div>

    </section>
  );
}

function formatDeltaLabel(
  deltaPercent: number,
  t: ReturnType<typeof useTranslations>,
  days: number,
): string {
  if (deltaPercent === 0) {
    return t('kpis.deltaFlat', { days });
  }
  // Percent is already rounded to 1 decimal by the API.
  const absValue = Math.abs(deltaPercent);
  if (deltaPercent > 0) {
    return t('kpis.deltaPositive', { value: absValue, days });
  }
  // For negative, surface the minus sign ourselves so the copy reads "-12.4% vs…"
  return t('kpis.deltaNegative', { value: `-${absValue}`, days });
}

function KpisSkeleton() {
  return (
    <div
      data-testid="editor-analytics-kpis-loading"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4"
          style={{ minHeight: 108 }}
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-20" />
          <Skeleton className="mt-3 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}
