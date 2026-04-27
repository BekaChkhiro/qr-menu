'use client';

import { CheckCircle2, Clock, Sparkles, type LucideIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, parseISO } from 'date-fns';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMenuAnalytics } from '@/hooks/use-analytics';
import type { ChartEvent } from '@/lib/validations/analytics';
import { useAnalyticsRange } from './analytics-range-context';

interface ViewsOverTimeChartProps {
  menuId: string;
  hasAnalytics: boolean;
}

// Match the design's 900×260 viewBox + padding from analytics-page.jsx:108.
const CHART_W = 900;
const CHART_H = 260;
const PAD = { l: 36, r: 16, t: 10, b: 26 };

// Slate `#3B4254` for the unique-scans line — the Section H "muted dark"
// counterpart to terracotta accent. Same value the dashboard uses.
const SCANS_STROKE = '#3B4254';

// Five evenly-spaced X-axis ticks across the period.
const X_TICK_COUNT = 5;

const EVENT_META: Record<
  ChartEvent['type'],
  { icon: LucideIcon; color: string; key: 'menuPublished' | 'promotionStarted' | 'promotionEnded' }
> = {
  MENU_PUBLISHED: {
    icon: CheckCircle2,
    color: SCANS_STROKE,
    key: 'menuPublished',
  },
  PROMOTION_STARTED: {
    icon: Sparkles,
    color: 'hsl(var(--accent))',
    key: 'promotionStarted',
  },
  PROMOTION_ENDED: {
    icon: Clock,
    color: SCANS_STROKE,
    key: 'promotionEnded',
  },
};

export function ViewsOverTimeChart({
  menuId,
  hasAnalytics,
}: ViewsOverTimeChartProps) {
  const t = useTranslations('admin.editor.analytics.chart');
  const { filters } = useAnalyticsRange();
  const { data, isLoading } = useMenuAnalytics(menuId, filters);

  const dailyViews = data?.dailyViews ?? [];
  const dailyScans = data?.kpis.uniqueScans.daily ?? [];
  const events = data?.events ?? [];
  const periodDays = data?.period.days ?? 30;

  const hasData =
    dailyViews.some((d) => d.views > 0) || dailyScans.some((s) => s > 0);

  return (
    <section
      data-testid="editor-analytics-chart-card"
      data-plan-locked={hasAnalytics ? 'false' : 'true'}
      data-period-days={periodDays}
      aria-labelledby="editor-analytics-chart-title"
      className="relative overflow-hidden rounded-[12px] border border-border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-[18px] py-[14px]">
        <h3
          id="editor-analytics-chart-title"
          className="text-[13.5px] font-semibold tracking-[-0.2px] text-text-default"
        >
          {t('title')}
        </h3>
        <div
          className="flex flex-wrap items-center gap-3.5 text-[11.5px]"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-[5px] text-text-default">
            <span className="block h-[2px] w-[10px] rounded-[1px] bg-accent" />
            {t('legend.views')}
          </span>
          <span className="inline-flex items-center gap-[5px] text-text-muted">
            <svg
              width="14"
              height="2"
              aria-hidden="true"
              className="block"
            >
              <line
                x1="0"
                y1="1"
                x2="14"
                y2="1"
                stroke={SCANS_STROKE}
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            </svg>
            {t('legend.uniqueScans')}
          </span>
          <span className="text-text-subtle">
            {t('period.lastNDays', { days: periodDays })}
          </span>
        </div>
      </header>

      <div
        className={cn(
          'px-[18px] pb-[10px] pt-[14px]',
          !hasAnalytics &&
            'pointer-events-none select-none opacity-55 blur-[6px]',
        )}
        aria-hidden={hasAnalytics ? undefined : true}
      >
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : hasData ? (
          <ChartSvg
            dailyViews={dailyViews}
            dailyScans={dailyScans}
            events={events}
          />
        ) : (
          <EmptyChart />
        )}
      </div>
    </section>
  );
}

interface ChartSvgProps {
  dailyViews: Array<{ date: string; views: number }>;
  dailyScans: number[];
  events: ChartEvent[];
}

function ChartSvg({ dailyViews, dailyScans, events }: ChartSvgProps) {
  const t = useTranslations('admin.editor.analytics.chart');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const overlayRef = useRef<SVGRectElement | null>(null);

  const geometry = useMemo(() => {
    const plotW = CHART_W - PAD.l - PAD.r;
    const plotH = CHART_H - PAD.t - PAD.b;
    const N = dailyViews.length;

    const views = dailyViews.map((d) => d.views);
    const scans = dailyScans;
    const all = [...views, ...scans];
    const peak = Math.max(...all, 0);
    // Round up to a "nice" max with at least 4 headroom and 8% padding.
    const niceMax = Math.max(Math.ceil((peak * 1.08) / 4) * 4, 4);

    const toX = (i: number) =>
      N <= 1 ? PAD.l + plotW / 2 : PAD.l + (i / (N - 1)) * plotW;
    const toY = (v: number) =>
      PAD.t + plotH - (v / niceMax) * plotH;

    const linePath = (arr: number[]): string => {
      if (arr.length === 0) return '';
      return (
        'M ' +
        arr
          .map((v, i) => `${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
          .join(' L ')
      );
    };

    const viewsPath = linePath(views);
    const scansPath = linePath(scans);

    const areaPath =
      viewsPath +
      ` L ${toX(views.length - 1).toFixed(1)} ${(CHART_H - PAD.b).toFixed(1)}` +
      ` L ${toX(0).toFixed(1)} ${(CHART_H - PAD.b).toFixed(1)} Z`;

    const yTicks = [0, niceMax / 3, (2 * niceMax) / 3, niceMax].map((v) =>
      Math.round(v),
    );

    const xLabels: Array<{ index: number; label: string }> = [];
    for (let i = 0; i < X_TICK_COUNT; i++) {
      const idx =
        N <= 1
          ? 0
          : Math.round((i * (N - 1)) / Math.max(X_TICK_COUNT - 1, 1));
      xLabels.push({
        index: idx,
        label: format(parseISO(dailyViews[idx].date), 'MMM d'),
      });
    }

    // Map events to day index by matching the YYYY-MM-DD string. Events
    // outside the period are filtered server-side, but we double-check.
    const dateToIndex = new Map<string, number>();
    dailyViews.forEach((d, i) => dateToIndex.set(d.date, i));
    const pinnedEvents = events
      .map((e) => {
        const idx = dateToIndex.get(e.date);
        return idx === undefined ? null : { ...e, index: idx };
      })
      .filter((e): e is ChartEvent & { index: number } => e !== null);

    return {
      plotW,
      plotH,
      views,
      scans,
      niceMax,
      toX,
      toY,
      viewsPath,
      scansPath,
      areaPath,
      yTicks,
      xLabels,
      pinnedEvents,
    };
  }, [dailyViews, dailyScans, events]);

  const handlePointerMove = (
    e: React.PointerEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>,
  ) => {
    const rect = overlayRef.current;
    if (!rect) return;
    const bbox = rect.getBoundingClientRect();
    const ratio = (e.clientX - bbox.left) / bbox.width;
    const N = dailyViews.length;
    if (N <= 0) return;
    const idx = Math.max(0, Math.min(N - 1, Math.round(ratio * (N - 1))));
    setActiveIndex(idx);
  };

  const handlePointerLeave = () => setActiveIndex(null);

  const tooltipIndex = activeIndex;
  const showTooltip = tooltipIndex !== null && tooltipIndex < dailyViews.length;

  // Tooltip box dimensions and clamped position.
  let tooltipX = 0;
  let tooltipY = 0;
  if (showTooltip && tooltipIndex !== null) {
    const tx = geometry.toX(tooltipIndex);
    const ty = geometry.toY(geometry.views[tooltipIndex] ?? 0);
    const TT_W = 168;
    const TT_H = 60;
    tooltipX = Math.min(
      CHART_W - PAD.r - TT_W,
      Math.max(PAD.l, tx + 12),
    );
    tooltipY = Math.max(PAD.t + 4, ty - TT_H - 8);
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="block"
      data-testid="editor-analytics-chart-svg"
      data-active-index={tooltipIndex ?? ''}
      role="img"
      aria-label={t('ariaChart', {
        peak: geometry.niceMax,
        days: dailyViews.length,
      })}
    >
      {/* Y-axis gridlines and labels */}
      {geometry.yTicks.map((value, i) => {
        const y = geometry.toY(value);
        return (
          <g key={`y-${i}`}>
            <line
              x1={PAD.l}
              x2={CHART_W - PAD.r}
              y1={y}
              y2={y}
              stroke="hsl(var(--border-soft))"
              strokeWidth="1"
            />
            <text
              x={PAD.l - 6}
              y={y + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="hsl(var(--text-subtle))"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {value.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Area fill under the views line */}
      <path
        d={geometry.areaPath}
        fill="hsl(var(--accent))"
        fillOpacity="0.10"
      />

      {/* Views — solid terracotta */}
      <path
        data-testid="editor-analytics-chart-views-line"
        d={geometry.viewsPath}
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Scans — dashed slate */}
      <path
        data-testid="editor-analytics-chart-scans-line"
        d={geometry.scansPath}
        fill="none"
        stroke={SCANS_STROKE}
        strokeWidth="1.8"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />

      {/* Event pins — vertical guide + dot + label */}
      {geometry.pinnedEvents.map((event, i) => {
        const meta = EVENT_META[event.type];
        const x = geometry.toX(event.index);
        const labelText = t(`events.${meta.key}`);
        return (
          <g
            key={`pin-${i}`}
            data-testid="editor-analytics-chart-event-pin"
            data-event-type={event.type}
            data-event-date={event.date}
          >
            <line
              x1={x}
              x2={x}
              y1={PAD.t}
              y2={CHART_H - PAD.b}
              stroke={meta.color}
              strokeOpacity="0.25"
              strokeDasharray="2 3"
            />
            <g transform={`translate(${x}, ${PAD.t + 4})`}>
              <circle cx="0" cy="0" r="7" fill="#fff" stroke={meta.color} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2.5" fill={meta.color} />
            </g>
            <text
              x={x + 10}
              y={PAD.t + 8}
              fontSize="10"
              fill={meta.color}
              fontWeight="600"
            >
              {labelText}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {geometry.xLabels.map((label, i) => (
        <text
          key={`x-${i}`}
          x={geometry.toX(label.index)}
          y={CHART_H - PAD.b + 16}
          textAnchor="middle"
          fontSize="10"
          fill="hsl(var(--text-subtle))"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {label.label}
        </text>
      ))}

      {/* Hover-target rects (one per day) for deterministic test focus */}
      <g data-testid="editor-analytics-chart-hit-areas">
        {dailyViews.map((d, i) => {
          const N = dailyViews.length;
          const segW = geometry.plotW / Math.max(N - 1, 1);
          const cx = geometry.toX(i);
          return (
            <rect
              key={`hit-${i}`}
              data-testid={`editor-analytics-chart-day-${i}`}
              data-day-date={d.date}
              x={cx - segW / 2}
              y={PAD.t}
              width={segW}
              height={geometry.plotH}
              fill="transparent"
              tabIndex={0}
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onBlur={() => setActiveIndex((prev) => (prev === i ? null : prev))}
              aria-label={t('hitAreaLabel', {
                date: format(parseISO(d.date), 'MMM d, yyyy'),
                views: d.views,
                scans: dailyScans[i] ?? 0,
              })}
            />
          );
        })}
      </g>

      {/* Catch-all overlay for free-form pointer tracking */}
      <rect
        ref={overlayRef}
        x={PAD.l}
        y={PAD.t}
        width={geometry.plotW}
        height={geometry.plotH}
        fill="transparent"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
      />

      {/* Tooltip */}
      {showTooltip && tooltipIndex !== null && (
        <g
          data-testid="editor-analytics-chart-tooltip"
          data-active-day={dailyViews[tooltipIndex].date}
          pointerEvents="none"
        >
          <line
            x1={geometry.toX(tooltipIndex)}
            x2={geometry.toX(tooltipIndex)}
            y1={PAD.t}
            y2={CHART_H - PAD.b}
            stroke="hsl(var(--text-default))"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle
            cx={geometry.toX(tooltipIndex)}
            cy={geometry.toY(geometry.views[tooltipIndex])}
            r="4"
            fill="hsl(var(--accent))"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle
            cx={geometry.toX(tooltipIndex)}
            cy={geometry.toY(geometry.scans[tooltipIndex] ?? 0)}
            r="4"
            fill={SCANS_STROKE}
            stroke="#fff"
            strokeWidth="2"
          />
          <g transform={`translate(${tooltipX}, ${tooltipY})`}>
            <rect
              x="0"
              y="0"
              width="168"
              height="60"
              rx="8"
              fill="hsl(var(--text-default))"
            />
            <text
              x="12"
              y="18"
              fontSize="10.5"
              fill="rgba(255,255,255,0.7)"
              fontWeight="500"
            >
              {format(parseISO(dailyViews[tooltipIndex].date), 'MMM d, yyyy')}
            </text>
            <circle cx="14" cy="32" r="3" fill="hsl(var(--accent))" />
            <text x="22" y="35" fontSize="11" fill="#fff" fontWeight="500">
              {t('tooltip.views')}
            </text>
            <text
              data-testid="editor-analytics-chart-tooltip-views"
              x="156"
              y="35"
              fontSize="11.5"
              fill="#fff"
              textAnchor="end"
              fontWeight="600"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {(geometry.views[tooltipIndex] ?? 0).toLocaleString()}
            </text>
            <circle cx="14" cy="48" r="3" fill="#8B9BB0" />
            <text
              x="22"
              y="51"
              fontSize="11"
              fill="rgba(255,255,255,0.85)"
              fontWeight="500"
            >
              {t('tooltip.uniqueScans')}
            </text>
            <text
              data-testid="editor-analytics-chart-tooltip-scans"
              x="156"
              y="51"
              fontSize="11.5"
              fill="#fff"
              textAnchor="end"
              fontWeight="600"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {(geometry.scans[tooltipIndex] ?? 0).toLocaleString()}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}

function EmptyChart() {
  const t = useTranslations('admin.editor.analytics.chart');
  return (
    <div
      data-testid="editor-analytics-chart-empty"
      className="flex h-[240px] flex-col items-center justify-center rounded-[10px] border border-dashed border-border-soft bg-bg/40 text-center"
    >
      <span className="text-[12.5px] font-medium text-text-muted">
        {t('empty')}
      </span>
    </div>
  );
}
