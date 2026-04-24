'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Info,
  MapPin,
  QrCode,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import type { Category, Product } from '@/types/menu';

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
        !hasAnalytics && 'pointer-events-none select-none opacity-55 blur-[6px]',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft px-[18px] py-[14px]">
        <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold tracking-[-0.2px] text-text-default">
          {titleIcon}
          {title}
        </h3>
        {rightSlot}
      </header>
      <div className={cn('p-[18px]', disabled && 'pointer-events-none')}>
        {children}
      </div>
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
// Heatmap preview (7 days × 24 hours). Deterministic — mirrors design
// reference `analytics-page.jsx` ViewsHeatmap so baselines are stable.
// ─────────────────────────────────────────────────────────────────────────────

const HEATMAP_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type HeatmapDayKey = (typeof HEATMAP_DAY_KEYS)[number];

function buildHeatmapData(): number[][] {
  return HEATMAP_DAY_KEYS.map((_, di) =>
    Array.from({ length: 24 }, (_, h) => {
      let base = 0.25;
      if (h >= 7 && h <= 10) base = 0.45;
      else if (h >= 11 && h <= 14) base = 0.75;
      else if (h >= 18 && h <= 21) base = 0.65;
      else if (h >= 0 && h <= 5) base = 0.06;
      if (di >= 5) base = Math.min(1, base * 1.35);
      if (di === 5 && h === 13) base = 1;
      if (di === 1 && h === 6) base = 0.02;
      const noise = ((Math.sin(di * 7.1 + h * 3.3) + 1) / 2) * 0.15;
      return Math.min(1, Math.max(0, base + noise - 0.07));
    }),
  );
}

function heatmapColor(v: number): string {
  if (v < 0.05) return '#F6F4F0';
  const alpha = Math.max(0.12, v);
  return `rgba(184, 99, 61, ${alpha})`;
}

export function HeatmapPreviewCard({ hasAnalytics }: AdvancedSectionProps) {
  const t = useTranslations('admin.editor.analytics.advanced.heatmap');
  const data = useMemo(buildHeatmapData, []);

  return (
    <SectionCard
      testid="editor-analytics-heatmap-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
      disabled
    >
      <ComingSoonBanner
        copy={t('comingSoon')}
        testid="editor-analytics-heatmap-coming-soon"
      />

      {/* Hour axis */}
      <div
        className="relative mb-1 ml-10 h-3.5"
        aria-hidden="true"
      >
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
        {data.map((row, di) => (
          <div
            key={HEATMAP_DAY_KEYS[di]}
            data-day={HEATMAP_DAY_KEYS[di]}
            className="flex items-center gap-[2px]"
          >
            <span className="w-10 text-[11px] font-medium text-text-muted">
              {t(`days.${HEATMAP_DAY_KEYS[di] as HeatmapDayKey}`)}
            </span>
            {row.map((v, hi) => {
              const isPeak = di === 5 && hi === 13;
              return (
                <span
                  key={hi}
                  data-hour={hi}
                  data-peak={isPeak ? 'true' : undefined}
                  className={cn(
                    'h-[22px] flex-1 rounded-[3px]',
                    isPeak && 'outline outline-[1.5px] outline-text-default',
                  )}
                  style={{ background: heatmapColor(v) }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend row */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-text-subtle">
        <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-accent-soft px-2.5 py-1.5 text-[12px] text-text-default">
          <Sparkles size={12} className="text-accent" strokeWidth={1.8} />
          <strong className="font-semibold">{t('peakLabel')}</strong>
          <span>{t('peakValue')}</span>
          <span className="text-text-muted">· {t('quietValue')}</span>
        </span>
        <span
          className="flex items-center gap-2"
          aria-label={t('legendAriaLabel')}
        >
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
// Geography preview (top cities). Deterministic placeholder.
// ─────────────────────────────────────────────────────────────────────────────

const GEOGRAPHY_ROWS = [
  { cityKey: 'tbilisi', views: 9412, pct: 73, primary: true },
  { cityKey: 'batumi', views: 1504, pct: 12, primary: false },
  { cityKey: 'kutaisi', views: 612, pct: 5, primary: false },
  { cityKey: 'rustavi', views: 321, pct: 3, primary: false },
  { cityKey: 'other', views: 998, pct: 8, primary: false },
] as const;

export function GeographyPreviewCard({ hasAnalytics }: AdvancedSectionProps) {
  const t = useTranslations('admin.editor.analytics.advanced.geography');

  return (
    <SectionCard
      testid="editor-analytics-geography-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
      titleIcon={
        <MapPin size={13} strokeWidth={1.8} className="text-text-muted" />
      }
      disabled
    >
      <ComingSoonBanner
        copy={t('comingSoon')}
        testid="editor-analytics-geography-coming-soon"
      />

      <ul
        data-testid="editor-analytics-geography-rows"
        className="m-0 flex flex-col gap-2.5 p-0"
      >
        {GEOGRAPHY_ROWS.map((row) => (
          <li
            key={row.cityKey}
            data-city={row.cityKey}
            data-primary={row.primary ? 'true' : 'false'}
            className="relative list-none"
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-0 rounded-[5px] opacity-65',
                row.primary ? 'bg-accent-soft' : 'bg-chip',
              )}
              style={{ width: `${row.pct}%` }}
            />
            <div className="relative flex items-center gap-2.5 px-3 py-2 text-[12.5px]">
              <span className="flex-1 font-medium text-text-default">
                {t(`cities.${row.cityKey}`)}
              </span>
              <span className="text-[11px] text-text-muted tabular-nums">
                {row.pct}%
              </span>
              <span className="w-14 text-right font-semibold text-text-default tabular-nums">
                {row.views.toLocaleString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Traffic source preview (stacked bar + QR locations). Deterministic.
// ─────────────────────────────────────────────────────────────────────────────

const TRAFFIC_SOURCES = [
  { key: 'qr', pct: 78, color: 'hsl(var(--accent))' },
  { key: 'direct', pct: 15, color: '#3B4254' },
  { key: 'social', pct: 7, color: '#C9A074' },
] as const;

const QR_LOCATIONS = [
  { key: 'table6', scans: 1284, pct: 100 },
  { key: 'entrance', scans: 1102, pct: 86 },
  { key: 'table2', scans: 942, pct: 73 },
  { key: 'bar', scans: 620, pct: 48 },
  { key: 'receipt', scans: 412, pct: 32 },
] as const;

export function TrafficSourcePreviewCard({
  hasAnalytics,
}: AdvancedSectionProps) {
  const t = useTranslations('admin.editor.analytics.advanced.trafficSource');

  return (
    <SectionCard
      testid="editor-analytics-traffic-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
      disabled
    >
      <ComingSoonBanner
        copy={t('comingSoon')}
        testid="editor-analytics-traffic-coming-soon"
      />

      {/* Stacked share bar */}
      <div
        data-testid="editor-analytics-traffic-bar"
        role="img"
        aria-label={t('barAriaLabel')}
        className="mb-2.5 flex h-7 overflow-hidden rounded-[6px]"
      >
        {TRAFFIC_SOURCES.map((src) => (
          <div
            key={src.key}
            data-source={src.key}
            className="flex items-center justify-start text-[11.5px] font-semibold text-white tabular-nums"
            style={{
              width: `${src.pct}%`,
              background: src.color,
              paddingLeft: src.pct > 10 ? 10 : 0,
            }}
          >
            {src.pct > 10 ? `${src.pct}%` : ''}
          </div>
        ))}
      </div>

      <ul className="mb-5 flex flex-wrap gap-4 text-[11.5px] text-text-default">
        {TRAFFIC_SOURCES.map((src) => (
          <li
            key={src.key}
            className="flex list-none items-center gap-1.5 p-0"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-[2.5px]"
              style={{ background: src.color }}
            />
            <span className="font-medium">{t(`legend.${src.key}`)}</span>
            <span className="text-text-muted tabular-nums">{src.pct}%</span>
          </li>
        ))}
      </ul>

      <div className="mb-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.5px] text-text-subtle">
        <QrCode size={11} strokeWidth={1.8} />
        {t('qrLocationsHeading')}
      </div>

      <ul
        data-testid="editor-analytics-traffic-locations"
        className="m-0 flex flex-col p-0"
      >
        {QR_LOCATIONS.map((loc, idx) => (
          <li
            key={loc.key}
            data-location={loc.key}
            className={cn(
              'grid list-none items-center gap-3 py-2',
              idx !== QR_LOCATIONS.length - 1 && 'border-b border-border-soft',
            )}
            style={{ gridTemplateColumns: '22px 1fr 2fr 70px' }}
          >
            <span className="font-mono text-[10.5px] font-bold text-text-subtle">
              #{idx + 1}
            </span>
            <span className="text-[12.5px] font-medium text-text-default">
              {t(`locations.${loc.key}`)}
            </span>
            <div className="h-[5px] overflow-hidden rounded-[3px] bg-chip">
              <div
                className="h-full bg-accent"
                style={{ width: `${loc.pct}%` }}
              />
            </div>
            <span className="text-right text-[12px] font-semibold text-text-default tabular-nums">
              {loc.scans.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top products — reuses the T11.8 price-DESC heuristic, scoped to this menu.
// Labeled "Preview" with a tooltip; interaction stays enabled since the data
// is real (just ranked by price until per-product view tracking ships).
// ─────────────────────────────────────────────────────────────────────────────

function pickProductName(
  product: Pick<Product, 'nameKa' | 'nameEn' | 'nameRu'>,
  locale: string,
): string {
  if (locale === 'en' && product.nameEn) return product.nameEn;
  if (locale === 'ru' && product.nameRu) return product.nameRu;
  return product.nameKa;
}

function pickCategoryName(
  category: Pick<Category, 'nameKa' | 'nameEn' | 'nameRu'>,
  locale: string,
): string {
  if (locale === 'en' && category.nameEn) return category.nameEn;
  if (locale === 'ru' && category.nameRu) return category.nameRu;
  return category.nameKa;
}

// Deterministic delta derived from product id. Purely cosmetic until
// per-product MenuView tracking lands.
function heuristicDelta(id: string): { value: number; up: boolean } {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  const mag = (Math.abs(h) % 15) + 1;
  const up = (h & 1) === 0;
  return { value: mag, up };
}

// Deterministic view count also driven by id — keeps the preview table stable
// under tests. The T15.4 description explicitly calls this out as heuristic.
function heuristicViews(rank: number, price: number): number {
  const base = Math.round(price * 30);
  const rankBoost = Math.max(0, 7 - rank) * 120;
  return base + rankBoost;
}

const TOP_PRODUCTS_LIMIT = 5;

export function TopProductsPreviewCard({ menuId, hasAnalytics }: MenuScopedProps) {
  const t = useTranslations('admin.editor.analytics.advanced.topProducts');
  const locale = useLocale();

  const { data: products, isLoading: productsLoading } = useProducts(menuId);
  const { data: categories, isLoading: categoriesLoading } =
    useCategories(menuId);

  const rows = useMemo(() => {
    if (!products || !categories) return [];
    const byCategory = new Map(categories.map((c) => [c.id, c]));
    return [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, TOP_PRODUCTS_LIMIT)
      .map((p, idx) => ({
        product: p,
        category: byCategory.get(p.categoryId),
        rank: idx + 1,
        views: heuristicViews(idx + 1, p.price),
        delta: heuristicDelta(p.id),
      }));
  }, [products, categories]);

  const isLoading = productsLoading || categoriesLoading;

  return (
    <SectionCard
      testid="editor-analytics-top-products-card"
      hasAnalytics={hasAnalytics}
      title={t('title')}
      rightSlot={
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                data-testid="editor-analytics-top-products-preview-badge"
                tabIndex={0}
                className="inline-flex cursor-help items-center gap-1 rounded-[4px] bg-chip px-1.5 py-[1px] text-[10.5px] font-semibold uppercase tracking-[0.3px] text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Info size={11} strokeWidth={2} aria-hidden="true" />
                {t('previewBadge')}
              </span>
            </TooltipTrigger>
            <TooltipContent
              data-testid="editor-analytics-top-products-preview-tooltip"
              side="top"
              className="max-w-[260px] text-[11.5px] leading-[1.45]"
            >
              {t('previewTooltip')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    >
      {isLoading ? (
        <TopProductsSkeleton />
      ) : rows.length === 0 ? (
        <p
          data-testid="editor-analytics-top-products-empty"
          className="py-6 text-center text-[12.5px] text-text-muted"
        >
          {t('empty')}
        </p>
      ) : (
        <ol
          data-testid="editor-analytics-top-products-rows"
          className="m-0 flex flex-col p-0"
        >
          {rows.map(({ product, category, rank, views, delta }) => {
            const isTopThree = rank <= 3;
            const name = pickProductName(product, locale);
            const categoryName = category
              ? pickCategoryName(category, locale)
              : t('uncategorized');
            return (
              <li
                key={product.id}
                data-testid="editor-analytics-top-products-row"
                data-rank={rank}
                className={cn(
                  'grid list-none items-center gap-3 px-3 py-2.5',
                  isTopThree
                    ? 'border-l-[3px] border-l-accent bg-[#FDFAF7]'
                    : 'border-l-[3px] border-l-transparent',
                  rank !== rows.length && 'border-b border-border-soft',
                )}
                style={{ gridTemplateColumns: '28px 1fr 80px 60px' }}
              >
                <span
                  className={cn(
                    'font-mono text-[11px] font-bold',
                    isTopThree ? 'text-accent' : 'text-text-subtle',
                  )}
                >
                  #{rank}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-text-default">
                    {name}
                  </div>
                  <div className="truncate text-[10.5px] text-text-subtle">
                    {categoryName}
                  </div>
                </div>
                <span className="text-right text-[12.5px] font-semibold text-text-default tabular-nums">
                  {views.toLocaleString()}
                </span>
                <span
                  data-delta-direction={delta.up ? 'up' : 'down'}
                  className={cn(
                    'inline-flex items-center justify-center gap-0.5 rounded-[4px] px-1.5 py-[1px] text-[10.5px] font-semibold tabular-nums',
                    delta.up
                      ? 'bg-success-soft text-success'
                      : 'bg-danger-soft text-danger',
                  )}
                >
                  {delta.up ? (
                    <TrendingUp size={10} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <TrendingDown
                      size={10}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                  {delta.up ? '+' : '−'}
                  {delta.value}%
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}

function TopProductsSkeleton() {
  return (
    <div
      data-testid="editor-analytics-top-products-skeleton"
      className="flex flex-col"
    >
      {Array.from({ length: TOP_PRODUCTS_LIMIT }).map((_, i) => (
        <div
          key={i}
          className="grid items-center gap-3 px-3 py-2.5"
          style={{ gridTemplateColumns: '28px 1fr 80px 60px' }}
        >
          <Skeleton className="h-3 w-5" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton className="ml-auto h-3 w-12" />
          <Skeleton className="ml-auto h-4 w-10" />
        </div>
      ))}
    </div>
  );
}
