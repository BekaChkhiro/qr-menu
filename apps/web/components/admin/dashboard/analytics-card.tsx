'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, Lock, Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';
import type { Plan } from '@prisma/client';

import { Segmented, SegmentedItem } from '@/components/ui/segmented';
import { cn } from '@/lib/utils';
import {
  useUserAnalytics,
  type UserAnalyticsPeriod,
} from '@/hooks/use-user-analytics';

interface DashboardAnalyticsCardProps {
  plan: Plan;
  /**
   * Number of published menus. When 0 the card shows an empty-state label
   * above the blurred chart instead of the big number — even on PRO, since
   * there's nothing to aggregate.
   */
  publishedMenuCount: number;
}

// Chart viewbox is fixed; the outer `<svg>` scales it with `preserveAspectRatio`.
const CHART_W = 720;
const CHART_H = 180;
const CHART_PAD = 20;

// Catmull-Rom -> Bezier smoothing. The design uses a quadratic+T approximation
// (dashboard-top.jsx:AreaChart), which reads as a smooth area even with sparse
// data. We keep that shape so the baseline matches the handoff.
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    const cy = (prev.y + curr.y) / 2;
    d += ` Q ${cx} ${prev.y}, ${cx} ${cy}`;
    d += ` T ${curr.x} ${curr.y}`;
  }
  return d;
}

function formatCompact(n: number, locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}

function formatNumber(n: number, locale = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return String(n);
  }
}

interface AreaChartProps {
  data: Array<{ date: string; views: number }>;
  locked: boolean;
}

function AreaChart({ data, locked }: AreaChartProps) {
  const { path, areaPath, xs, yLabels, xLabels, max, lastPoint } = useMemo(() => {
    const values = data.map((d) => d.views);
    const rawMax = Math.max(...values, 1);
    // +10 % headroom so the peak doesn't sit on the border
    const max = rawMax * 1.1;
    const min = 0;

    const xsLocal = data.map(
      (_, i) =>
        CHART_PAD + (i * (CHART_W - CHART_PAD * 2)) / Math.max(data.length - 1, 1),
    );
    const ysLocal = values.map(
      (v) => CHART_H - CHART_PAD - ((v - min) / (max - min)) * (CHART_H - CHART_PAD * 2),
    );

    const points = xsLocal.map((x, i) => ({ x, y: ysLocal[i] }));
    const p = buildSmoothPath(points);
    const area =
      p +
      ` L ${xsLocal[xsLocal.length - 1]} ${CHART_H - CHART_PAD}` +
      ` L ${xsLocal[0]} ${CHART_H - CHART_PAD} Z`;

    // 5 y-gridlines at 0, 25, 50, 75, 100 % of the rounded max.
    const niceMax = Math.ceil(rawMax / 4) * 4 || 4;
    const yLabelsLocal = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax].map(
      (v) => Math.round(v),
    );

    // 5 x-axis tick labels spread across the range.
    const xLabelsLocal: Array<{ x: number; label: string }> = [];
    if (data.length > 0) {
      const tickCount = Math.min(5, data.length);
      for (let i = 0; i < tickCount; i++) {
        const idx = Math.round((i * (data.length - 1)) / Math.max(tickCount - 1, 1));
        const d = parseISO(data[idx].date);
        xLabelsLocal.push({
          x: xsLocal[idx],
          label: format(d, 'MMM d'),
        });
      }
    }

    return {
      path: p,
      areaPath: area,
      xs: xsLocal,
      yLabels: yLabelsLocal,
      xLabels: xLabelsLocal,
      max,
      lastPoint: {
        x: xsLocal[xsLocal.length - 1],
        y: ysLocal[ysLocal.length - 1],
      },
    };
  }, [data]);

  const niceMax = yLabels[yLabels.length - 1];

  return (
    <svg
      width="100%"
      height={CHART_H + 30}
      viewBox={`0 0 ${CHART_W} ${CHART_H + 30}`}
      style={
        locked
          ? { display: 'block', filter: 'blur(6px)', opacity: 0.55 }
          : { display: 'block' }
      }
      data-testid="analytics-area-chart"
      aria-hidden={locked ? true : undefined}
    >
      {yLabels.map((v, i) => {
        const y =
          CHART_H -
          CHART_PAD -
          ((v - 0) / (max - 0)) * (CHART_H - CHART_PAD * 2);
        return (
          <g key={`y-${i}`}>
            <line
              x1={CHART_PAD}
              y1={y}
              x2={CHART_W - CHART_PAD}
              y2={y}
              stroke="hsl(var(--border-soft))"
              strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '2 3'}
            />
            <text
              x={0}
              y={y + 3}
              fontSize="10"
              fill="hsl(var(--text-subtle))"
              fontFamily="inherit"
            >
              {formatCompact(v)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="hsl(var(--accent))" fillOpacity="0.12" />
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {xs.length > 0 && (
        <>
          <circle cx={lastPoint.x} cy={lastPoint.y} r="7" fill="hsl(var(--accent))" fillOpacity="0.15" />
          <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill="hsl(var(--accent))" />
        </>
      )}
      {xLabels.map((l, i) => (
        <text
          key={`x-${i}`}
          x={l.x}
          y={CHART_H + 16}
          fontSize="10"
          fill="hsl(var(--text-subtle))"
          fontFamily="inherit"
          textAnchor="middle"
        >
          {l.label}
        </text>
      ))}
      <title>{`Menu views, peak ${formatNumber(niceMax)}`}</title>
    </svg>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const t = useTranslations('admin.dashboard.analytics');
  const rounded = Math.round(delta * 10) / 10;
  const kind = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat';

  const Icon = kind === 'up' ? ArrowUp : kind === 'down' ? ArrowDown : Minus;
  const color =
    kind === 'up'
      ? 'bg-success-soft text-success'
      : kind === 'down'
        ? 'bg-danger-soft text-danger'
        : 'bg-chip text-text-muted';

  const label =
    kind === 'up'
      ? t('deltaUp', { value: Math.abs(rounded) })
      : kind === 'down'
        ? t('deltaDown', { value: Math.abs(rounded) })
        : t('deltaFlat');

  return (
    <span
      data-testid="analytics-delta-badge"
      data-delta-kind={kind}
      className={cn(
        'inline-flex items-center gap-1 rounded-[5px] px-[7px] py-[2px]',
        'text-[11.5px] font-semibold tabular-nums',
        color,
      )}
    >
      <Icon className="h-[10px] w-[10px]" strokeWidth={2.2} />
      {label}
    </span>
  );
}

function EmptyChart({ locked }: { locked: boolean }) {
  const t = useTranslations('admin.dashboard.analytics');
  return (
    <div
      data-testid="analytics-empty"
      className={cn(
        'flex h-[210px] flex-col items-center justify-center rounded-lg border border-dashed border-border-soft bg-bg/40 text-center',
        locked && 'blur-[6px] opacity-55',
      )}
      aria-hidden={locked ? true : undefined}
    >
      <span className="text-[12.5px] font-medium text-text-muted">
        {t('emptyTitle')}
      </span>
      <span className="mt-1 text-[11.5px] text-text-subtle">{t('emptyBody')}</span>
    </div>
  );
}

function LoadingChart() {
  return (
    <div
      data-testid="analytics-loading"
      className="h-[210px] animate-pulse rounded-lg bg-border-soft/40"
      aria-hidden
    />
  );
}

function LockedOverlay() {
  const t = useTranslations('admin.dashboard.analytics');
  return (
    <div
      data-testid="analytics-locked-overlay"
      className="absolute inset-0 flex items-center justify-center"
      // Semi-opaque beige veil, matches the design's rgba(252,251,248,0.55).
      style={{ background: 'hsl(var(--bg) / 0.55)' }}
    >
      <div className="max-w-[320px] rounded-card border border-border bg-card px-6 py-5 text-center shadow-xs">
        <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
          <Lock className="h-[17px] w-[17px]" strokeWidth={1.5} />
        </div>
        <div className="mb-1 text-[14.5px] font-semibold text-text-default">
          {t('lockedTitle')}
        </div>
        <div className="mb-3 text-[12.5px] leading-[1.5] text-text-muted">
          {t('lockedBody')}
        </div>
        <Link
          href="/admin/settings/billing"
          data-testid="analytics-upgrade-cta"
          className="inline-flex items-center justify-center rounded-[7px] bg-text-default px-[14px] py-[7px] text-[12.5px] font-medium text-white hover:opacity-90"
        >
          {t('lockedCta')}
        </Link>
      </div>
    </div>
  );
}

export function DashboardAnalyticsCard({ plan, publishedMenuCount }: DashboardAnalyticsCardProps) {
  const [period, setPeriod] = useState<UserAnalyticsPeriod>('30d');
  const t = useTranslations('admin.dashboard.analytics');
  const locked = plan === 'FREE';

  // Still query on FREE — UI is blurred but we keep the loading/empty shape
  // consistent with the unlocked state. Skipping the fetch saves one request
  // but means the placeholder chart has no silhouette behind the overlay.
  const { data, isLoading } = useUserAnalytics(period);

  const overview = data?.overview;
  const hasData = (overview?.totalViews ?? 0) > 0;

  return (
    <section
      data-testid="dashboard-analytics-card"
      data-plan={plan}
      data-locked={locked || undefined}
      className="relative overflow-hidden rounded-card border border-border bg-card px-5 pb-5 pt-[18px]"
    >
      <header className="mb-3.5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-[3px] text-[12.5px] font-medium text-text-muted">
            {t('title', { period: t(`period.${period}`) })}
          </div>
          {publishedMenuCount === 0 ? (
            <div className="text-[14.5px] font-semibold text-text-default">
              {t('noPublishedMenus')}
            </div>
          ) : (
            <div
              className="flex items-baseline gap-2.5"
              data-testid="analytics-total-views"
            >
              <span className="text-[32px] font-semibold leading-none tracking-[-0.8px] text-text-default tabular-nums">
                {isLoading || !overview
                  ? '—'
                  : formatNumber(overview.totalViews)}
              </span>
              {overview && (
                <>
                  <DeltaBadge delta={overview.deltaPercent} />
                  <span className="text-[12px] text-text-muted">
                    {t('vsPrevious', { period: t(`period.${period}`) })}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {!locked && publishedMenuCount > 0 && (
          <Segmented
            value={period}
            onValueChange={(v) => setPeriod(v as UserAnalyticsPeriod)}
            ariaLabel={t('periodAriaLabel')}
            data-testid="analytics-period-selector"
            className="shrink-0"
          >
            <SegmentedItem value="7d" data-testid="analytics-period-7d">
              7d
            </SegmentedItem>
            <SegmentedItem value="30d" data-testid="analytics-period-30d">
              30d
            </SegmentedItem>
            <SegmentedItem value="90d" data-testid="analytics-period-90d">
              90d
            </SegmentedItem>
          </Segmented>
        )}
      </header>

      {isLoading ? (
        <LoadingChart />
      ) : hasData && data ? (
        <AreaChart data={data.dailyViews} locked={locked} />
      ) : (
        <EmptyChart locked={locked} />
      )}

      {locked && <LockedOverlay />}
    </section>
  );
}
