'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMenuAnalytics } from '@/hooks/use-analytics';
import type {
  BrowserBreakdown,
  DeviceBreakdown,
} from '@/lib/validations/analytics';

interface DeviceBreakdownCardProps {
  menuId: string;
  hasAnalytics: boolean;
}

// Canonical order + colors per design. Mobile is the hero slice, so its
// legend label always ranks first even when its count ties another device.
const DEVICE_ORDER: Array<{
  key: 'mobile' | 'desktop' | 'tablet' | 'other';
  match: RegExp;
  color: string;
}> = [
  { key: 'mobile', match: /^mobile$/i, color: 'hsl(var(--accent))' },
  { key: 'desktop', match: /^desktop$/i, color: '#3B4254' },
  { key: 'tablet', match: /^tablet$/i, color: '#C9A074' },
  { key: 'other', match: /.*/, color: '#B8C2CC' },
];

type DeviceKey = (typeof DEVICE_ORDER)[number]['key'];

interface CanonicalSegment {
  key: DeviceKey;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

function canonicaliseDevices(
  rows: DeviceBreakdown[],
  labels: Record<DeviceKey, string>,
): CanonicalSegment[] {
  const buckets = new Map<DeviceKey, { count: number; percentage: number }>();
  for (const row of rows) {
    const match = DEVICE_ORDER.find((d) => d.match.test(row.device))?.key ?? 'other';
    const existing = buckets.get(match);
    buckets.set(match, {
      count: (existing?.count ?? 0) + row.count,
      percentage: (existing?.percentage ?? 0) + row.percentage,
    });
  }
  return DEVICE_ORDER.filter((d) => buckets.has(d.key)).map((d) => {
    const bucket = buckets.get(d.key)!;
    return {
      key: d.key,
      label: labels[d.key],
      color: d.color,
      count: bucket.count,
      // Round summed percentages to a single decimal for display parity.
      percentage: Math.round(bucket.percentage * 10) / 10,
    };
  });
}

interface DonutProps {
  segments: CanonicalSegment[];
  ariaLabel: string;
}

function Donut({ segments, ariaLabel }: DonutProps) {
  const R = 48;
  const C = 2 * Math.PI * R;
  const total = segments.reduce((s, seg) => s + seg.percentage, 0);

  // When we have no data the full-circle track stays visible and no arcs
  // paint — the empty-state copy renders next to it.
  const hasData = total > 0;

  const arcs = useMemo(() => {
    if (!hasData) return [] as Array<{ key: string; length: number; offset: number; color: string }>;
    let offset = 0;
    return segments.map((seg) => {
      const length = (seg.percentage / 100) * C;
      const arc = { key: seg.key, length, offset, color: seg.color };
      offset += length;
      return arc;
    });
  }, [C, hasData, segments]);

  return (
    <svg
      data-testid="editor-analytics-device-donut"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      role="img"
      aria-label={ariaLabel}
    >
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke="hsl(var(--chip))"
        strokeWidth="14"
      />
      {arcs.map((arc) => (
        <circle
          key={arc.key}
          data-testid={`editor-analytics-device-arc-${arc.key}`}
          data-arc-length={arc.length.toFixed(2)}
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={arc.color}
          strokeWidth="14"
          strokeDasharray={`${arc.length} ${C - arc.length}`}
          strokeDashoffset={-arc.offset}
          transform="rotate(-90 60 60)"
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

export function DeviceBreakdownCard({
  menuId,
  hasAnalytics,
}: DeviceBreakdownCardProps) {
  const t = useTranslations('admin.editor.analytics.deviceBreakdown');
  const { data, isLoading } = useMenuAnalytics(menuId, { period: '30d' });

  const deviceRows = data?.deviceBreakdown ?? [];
  const browserRows: BrowserBreakdown[] = data?.browserBreakdown ?? [];

  const segments = canonicaliseDevices(deviceRows, {
    mobile: t('segments.mobile'),
    desktop: t('segments.desktop'),
    tablet: t('segments.tablet'),
    other: t('segments.other'),
  });

  const hasAnyViews = segments.some((s) => s.count > 0);

  return (
    <section
      data-testid="editor-analytics-device-card"
      data-plan-locked={hasAnalytics ? 'false' : 'true'}
      className={cn(
        'relative overflow-hidden rounded-[12px] border border-border bg-card',
        !hasAnalytics && 'pointer-events-none select-none opacity-55 blur-[6px]',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-[18px] py-[14px]">
        <h3 className="text-[13.5px] font-semibold tracking-[-0.2px] text-text-default">
          {t('title')}
        </h3>
      </header>

      <div className="p-[18px]">
        {isLoading ? (
          <DeviceBreakdownSkeleton />
        ) : (
          <>
            <div
              data-testid="editor-analytics-device-body"
              className="flex items-center gap-[18px]"
            >
              <Donut segments={segments} ariaLabel={t('donutAriaLabel')} />
              <ul
                data-testid="editor-analytics-device-legend"
                className="m-0 flex flex-1 flex-col gap-1.5 p-0"
              >
                {segments.length === 0 ? (
                  <li
                    data-testid="editor-analytics-device-empty"
                    className="list-none text-[12.5px] text-text-muted"
                  >
                    {t('empty')}
                  </li>
                ) : (
                  segments.map((seg, idx) => (
                    <li
                      key={seg.key}
                      data-testid="editor-analytics-device-legend-row"
                      data-device={seg.key}
                      data-rank={idx + 1}
                      className="flex list-none items-center gap-2 p-0"
                    >
                      <span
                        aria-hidden="true"
                        className="h-[9px] w-[9px] shrink-0 rounded-[2.5px]"
                        style={{ background: seg.color }}
                      />
                      <span className="flex-1 text-[12.5px] text-text-default">
                        {seg.label}
                      </span>
                      <span className="text-[12.5px] font-semibold text-text-default tabular-nums">
                        {seg.percentage.toFixed(seg.percentage % 1 === 0 ? 0 : 1)}%
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <BrowserList browsers={browserRows} hasAnyViews={hasAnyViews} />
          </>
        )}
      </div>
    </section>
  );
}

interface BrowserListProps {
  browsers: BrowserBreakdown[];
  hasAnyViews: boolean;
}

function BrowserList({ browsers, hasAnyViews }: BrowserListProps) {
  const t = useTranslations('admin.editor.analytics.deviceBreakdown.browsers');

  // Cap at 4 rows per the design reference — additional browsers would push
  // the card past the donut card height in the lg 2fr/1fr grid.
  const rows = browsers.slice(0, 4);

  return (
    <div
      data-testid="editor-analytics-browser-list"
      className="mt-4 border-t border-border-soft pt-3.5"
    >
      <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.5px] text-text-subtle">
        {t('heading')}
      </div>
      {rows.length === 0 || !hasAnyViews ? (
        <p
          data-testid="editor-analytics-browser-list-empty"
          className="text-[12px] text-text-muted"
        >
          {t('empty')}
        </p>
      ) : (
        <ul className="m-0 flex flex-col gap-1.5 p-0">
          {rows.map((b) => (
            <li
              key={b.browser}
              data-testid="editor-analytics-browser-row"
              data-browser={b.browser.toLowerCase()}
              className="flex list-none items-center gap-2.5 p-0"
            >
              <span className="w-[54px] shrink-0 text-[11.5px] text-text-default">
                {b.browser}
              </span>
              <div className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-chip">
                <div
                  className="h-full bg-text-muted"
                  style={{ width: `${b.percentage}%` }}
                />
              </div>
              <span className="w-6 text-right text-[11px] text-text-muted tabular-nums">
                {Math.round(b.percentage)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeviceBreakdownSkeleton() {
  return (
    <div
      data-testid="editor-analytics-device-skeleton"
      className="flex flex-col"
    >
      <div className="flex items-center gap-[18px]">
        <Skeleton className="h-[120px] w-[120px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <div className="mt-4 space-y-1.5 border-t border-border-soft pt-3.5">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
