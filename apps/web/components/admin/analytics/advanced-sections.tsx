'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, QrCode, Sparkles } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMenuAnalytics } from '@/hooks/use-analytics';
import type { GeographyRow } from '@/lib/validations/analytics';
import { useAnalyticsRange } from './analytics-range-context';

interface AdvancedSectionProps {
  hasAnalytics: boolean;
}

interface MenuScopedProps extends AdvancedSectionProps {
  menuId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card chrome — matches T15.1/T15.2 pattern (12px radius, border-soft header)
// ─────────────────────────────────────────────────────────────────────────────

interface SectionCardProps {
  testid: string;
  hasAnalytics: boolean;
  title: string;
  titleIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  /** When true the content is rendered inside `pointer-events-none` so the
   *  static preview cannot receive hover/focus events. */
  disabled?: boolean;
}

function SectionCard({
  testid,
  hasAnalytics,
  title,
  titleIcon,
  rightSlot,
  children,
  disabled = false,
}: SectionCardProps) {
  return (
    <section
      data-testid={testid}
      data-plan-locked={hasAnalytics ? 'false' : 'true'}
      data-preview={disabled ? 'true' : undefined}
      className={cn(
        'relative overflow-hidden rounded-[12px] border border-border bg-card',
        !hasAnalytics && 'pointer-events-none select-none opacity-55 blur-[6px]'
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-[18px] py-[14px]">
        <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold tracking-[-0.2px] text-text-default">
          {titleIcon}
          {title}
        </h3>
        {rightSlot}
      </header>
      <div className={cn('p-[18px]', disabled && 'pointer-events-none')}>{children}</div>
    </section>
  );
}

interface ComingSoonBannerProps {
  copy: string;
  testid: string;
}

function ComingSoonBanner({ copy, testid }: ComingSoonBannerProps) {
  const t = useTranslations('admin.editor.analytics.advanced');
  return (
    <div
      data-testid={testid}
      role="status"
      className="mb-4 flex items-start gap-2 rounded-[8px] bg-accent-soft px-3 py-2 text-[11.5px] leading-[1.45] text-text-default"
    >
      <Sparkles
        size={13}
        strokeWidth={1.8}
        className="mt-[1px] shrink-0 text-accent"
        aria-hidden="true"
      />
      <span>
        <strong className="font-semibold">{t('comingSoonLabel')}</strong>
        <span className="text-text-muted"> — {copy}</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap (7 days × 24 hours), backed by real menu view timestamps.
// ─────────────────────────────────────────────────────────────────────────────

const HEATMAP_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type HeatmapDayKey = (typeof HEATMAP_DAY_KEYS)[number];

function heatmapColor(v: number): string {
  if (v < 0.05) return '#F6F4F0';
  const alpha = Math.max(0.12, v);
  return `rgba(184, 99, 61, ${alpha})`;
}

export function HeatmapPreviewCard({ menuId, hasAnalytics }: MenuScopedProps) {
  const t = useTranslations('admin.editor.analytics.advanced.heatmap');
  const { filters } = useAnalyticsRange();
  const { data, isLoading } = useMenuAnalytics(menuId, filters);

  const heatmap = useMemo(() => {
    const counts = HEATMAP_DAY_KEYS.map(() => Array(24).fill(0) as number[]);
    for (const cell of data?.heatmap ?? []) {
      counts[cell.day][cell.hour] = cell.count;
    }
    const max = Math.max(...counts.flat(), 0);
    return {
      counts,
      intensities: counts.map((row) => row.map((count) => (max > 0 ? count / max : 0))),
      max,
    };
  }, [data?.heatmap]);

  return (
    <SectionCard
      testid="editor-analytics-heatmap-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
    >
      {/* Hour axis */}
      <div className="relative mb-1 ml-10 h-3.5" aria-hidden="true">
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
          <span
            key={h}
            className="absolute font-mono text-[10px] text-text-subtle tabular-nums"
            style={{ left: `calc(${(h / 24) * 100}% - 4px)` }}
          >
            {h.toString().padStart(2, '0')}
          </span>
        ))}
      </div>

      <div
        data-testid="editor-analytics-heatmap-grid"
        role="presentation"
        className="flex flex-col gap-[2px]"
      >
        {isLoading ? (
          <Skeleton className="h-[166px] w-full" />
        ) : (
          heatmap.intensities.map((row, di) => (
            <div
              key={HEATMAP_DAY_KEYS[di]}
              data-day={HEATMAP_DAY_KEYS[di]}
              className="flex items-center gap-[2px]"
            >
              <span className="w-10 text-[11px] font-medium text-text-muted">
                {t(`days.${HEATMAP_DAY_KEYS[di] as HeatmapDayKey}`)}
              </span>
              {row.map((v, hi) => {
                const count = heatmap.counts[di][hi];
                const isPeak = heatmap.max > 0 && count === heatmap.max;
                return (
                  <span
                    key={hi}
                    data-hour={hi}
                    title={`${count}`}
                    data-peak={isPeak ? 'true' : undefined}
                    className={cn(
                      'h-[22px] flex-1 rounded-[3px]',
                      isPeak && 'outline outline-[1.5px] outline-text-default'
                    )}
                    style={{ background: heatmapColor(v) }}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Legend row */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-text-subtle">
        <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-accent-soft px-2.5 py-1.5 text-[12px] text-text-default">
          <Sparkles size={12} className="text-accent" strokeWidth={1.8} />
          <strong className="font-semibold">{t('peakLabel')}</strong>
          <span>{heatmap.max.toLocaleString()}</span>
        </span>
        <span className="flex items-center gap-2" aria-label={t('legendAriaLabel')}>
          <span>{t('less')}</span>
          {[0.08, 0.3, 0.5, 0.7, 0.95].map((v) => (
            <span
              key={v}
              aria-hidden="true"
              className="h-3.5 w-3.5 rounded-[3px]"
              style={{ background: heatmapColor(v) }}
            />
          ))}
          <span>{t('more')}</span>
        </span>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Geography (top cities), backed by real geo headers when available.
// ─────────────────────────────────────────────────────────────────────────────

export function GeographyPreviewCard({ menuId, hasAnalytics }: MenuScopedProps) {
  const t = useTranslations('admin.editor.analytics.advanced.geography');
  const { filters } = useAnalyticsRange();
  const { data, isLoading } = useMenuAnalytics(menuId, filters);
  const rows = data?.geography ?? [];

  return (
    <SectionCard
      testid="editor-analytics-geography-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
      titleIcon={<MapPin size={13} strokeWidth={1.8} className="text-text-muted" />}
    >
      <ul data-testid="editor-analytics-geography-rows" className="m-0 flex flex-col gap-2.5 p-0">
        {isLoading ? (
          <GeographySkeleton />
        ) : rows.length === 0 ? (
          <li className="list-none py-6 text-center text-[12.5px] text-text-muted">{t('empty')}</li>
        ) : (
          rows.map((row, index) => (
            <GeographyListRow
              key={`${row.city}-${row.country ?? ''}`}
              row={row}
              primary={index === 0}
            />
          ))
        )}
      </ul>
    </SectionCard>
  );
}

function GeographyListRow({ row, primary }: { row: GeographyRow; primary: boolean }) {
  return (
    <li
      data-city={row.city}
      data-country={row.country ?? ''}
      data-primary={primary ? 'true' : 'false'}
      className="relative list-none"
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 rounded-[5px] opacity-65',
          primary ? 'bg-accent-soft' : 'bg-chip'
        )}
        style={{ width: `${row.percentage}%` }}
      />
      <div className="relative flex items-center gap-2.5 px-3 py-2 text-[12.5px]">
        <span className="flex-1 truncate font-medium text-text-default">
          {row.city}
          {row.country ? (
            <span className="font-normal text-text-subtle">, {row.country}</span>
          ) : null}
        </span>
        <span className="text-[11px] text-text-muted tabular-nums">{row.percentage}%</span>
        <span className="w-14 text-right font-semibold text-text-default tabular-nums">
          {row.count.toLocaleString()}
        </span>
      </div>
    </li>
  );
}

function GeographySkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="list-none">
          <Skeleton className="h-8 w-full rounded-[5px]" />
        </li>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Traffic source waits for source-level attribution. Keep it explicit instead
// of showing synthetic source percentages.
// ─────────────────────────────────────────────────────────────────────────────

export function TrafficSourcePreviewCard({ hasAnalytics }: AdvancedSectionProps) {
  const t = useTranslations('admin.editor.analytics.advanced.trafficSource');

  return (
    <SectionCard
      testid="editor-analytics-traffic-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
      disabled
    >
      <ComingSoonBanner copy={t('comingSoon')} testid="editor-analytics-traffic-coming-soon" />

      <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.5px] text-text-subtle">
        <QrCode size={11} strokeWidth={1.8} />
        {t('qrLocationsHeading')}
      </div>

      <ul data-testid="editor-analytics-traffic-locations" className="m-0 flex flex-col p-0">
        <li className="list-none py-6 text-center text-[12.5px] text-text-muted">{t('empty')}</li>
      </ul>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top products waits for product-level view attribution. Do not show heuristic
// product rankings here; the analytics tab should only surface real signals.
// ─────────────────────────────────────────────────────────────────────────────

export function TopProductsPreviewCard({ hasAnalytics }: MenuScopedProps) {
  const t = useTranslations('admin.editor.analytics.advanced.topProducts');

  return (
    <SectionCard
      testid="editor-analytics-top-products-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
    >
      <ComingSoonBanner copy={t('comingSoon')} testid="editor-analytics-top-products-coming-soon" />
      <p
        data-testid="editor-analytics-top-products-empty"
        className="py-6 text-center text-[12.5px] text-text-muted"
      >
        {t('empty')}
      </p>
    </SectionCard>
  );
}
