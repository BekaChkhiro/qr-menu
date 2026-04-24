'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { UtensilsCrossed } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTopProducts, type TopProductRow } from '@/hooks/use-top-products';
import { Skeleton } from '@/components/ui/skeleton';

const LIMIT = 5;
const DAYS = 30;

function pickLocaleName(
  name: TopProductRow['name'] | TopProductRow['category']['name'],
  locale: string,
): string {
  if (locale === 'en' && name.en) return name.en;
  if (locale === 'ru' && name.ru) return name.ru;
  return name.ka;
}

// Deterministic thumbnail tone for products with no image — same palette as
// MenuThumb so the dashboard stays visually coherent across widgets.
const THUMB_TONES: ReadonlyArray<readonly [string, string]> = [
  ['#C9B28A', '#8B6F47'],
  ['#B8633D', '#7A3F27'],
  ['#6B7F6B', '#3F5B3F'],
  ['#8A7CA0', '#5D4F70'],
  ['#D4A373', '#8B5A2B'],
  ['#5D7A91', '#344C63'],
];

function toneFor(id: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return THUMB_TONES[Math.abs(h) % THUMB_TONES.length];
}

function ProductThumb({
  id,
  imageUrl,
  name,
  size = 30,
}: {
  id: string;
  imageUrl: string | null;
  name: string;
  size?: number;
}) {
  if (imageUrl) {
    return (
      <span
        className="relative block shrink-0 overflow-hidden rounded-[7px]"
        style={{ width: size, height: size }}
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
    );
  }
  const [c1, c2] = toneFor(id);
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[7px]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
    >
      <UtensilsCrossed
        size={Math.round(size * 0.45)}
        strokeWidth={1.5}
        className="text-white/80"
      />
    </span>
  );
}

export function TopProductsCard() {
  const t = useTranslations('admin.dashboard.topProducts');
  const locale = useLocale();

  const { data, isLoading, isError } = useTopProducts({
    limit: LIMIT,
    days: DAYS,
  });

  const rows = data?.rows ?? [];
  const maxViews = rows.length > 0 ? Math.max(...rows.map((r) => r.views)) : 0;

  return (
    <section
      data-testid="dashboard-top-products"
      aria-label={t('title')}
      className="rounded-[12px] border border-border bg-card px-5 py-[18px]"
    >
      <div className="mb-[14px] flex items-center justify-between">
        <h2 className="m-0 text-[14.5px] font-semibold tracking-[-0.2px] text-text-default">
          {t('title')}
        </h2>
        <span className="text-[11.5px] text-text-muted tabular-nums">
          {t('subtitle', { days: DAYS })}
        </span>
      </div>

      {isLoading ? (
        <TopProductsSkeleton />
      ) : isError || rows.length === 0 ? (
        <TopProductsEmpty />
      ) : (
        <ul
          data-testid="dashboard-top-products-rows"
          className="m-0 flex list-none flex-col p-0"
        >
          {rows.map((row) => {
            const name = pickLocaleName(row.name, locale);
            const categoryName = pickLocaleName(row.category.name, locale);
            const pct = maxViews > 0 ? (row.views / maxViews) * 100 : 0;
            const isTopThree = row.rank <= 3;

            return (
              <li
                key={row.id}
                data-testid="dashboard-top-products-row"
                data-rank={row.rank}
                data-top-three={isTopThree ? 'true' : 'false'}
                className="relative -mx-[10px] overflow-hidden rounded-[7px] px-[10px] py-[9px]"
              >
                {/* Popularity bar (background fill). */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--accent-soft)) ${pct}%, transparent ${pct}%)`,
                    opacity: 0.5,
                  }}
                />

                <Link
                  href={`/admin/menus/${row.menu.id}`}
                  aria-label={t('viewRowLabel', {
                    name,
                    category: categoryName,
                    views: row.views,
                  })}
                  className="relative flex items-center gap-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  <span
                    className={cn(
                      'w-5 shrink-0 text-center text-[11px] font-semibold tabular-nums',
                      isTopThree ? 'text-accent' : 'text-text-muted',
                    )}
                    aria-label={t('rankLabel', { rank: row.rank })}
                  >
                    #{row.rank}
                  </span>

                  <ProductThumb
                    id={row.id}
                    imageUrl={row.imageUrl}
                    name={name}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-text-default">
                      {name}
                    </div>
                    <div className="truncate text-[11px] text-text-muted">
                      {categoryName}
                    </div>
                  </div>

                  <div className="shrink-0 text-[12.5px] font-semibold tabular-nums text-text-default">
                    {row.views.toLocaleString()}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TopProductsSkeleton() {
  return (
    <div
      data-testid="dashboard-top-products-skeleton"
      className="flex flex-col"
    >
      {Array.from({ length: LIMIT }).map((_, i) => (
        <div
          key={i}
          className="-mx-[10px] flex items-center gap-[11px] px-[10px] py-[9px]"
        >
          <Skeleton className="h-3 w-5" />
          <Skeleton className="h-[30px] w-[30px] rounded-[7px]" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

function TopProductsEmpty() {
  const t = useTranslations('admin.dashboard.topProducts.empty');
  return (
    <div
      data-testid="dashboard-top-products-empty"
      className="flex flex-col items-center gap-2 px-4 py-8 text-center"
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft"
      >
        <UtensilsCrossed
          size={18}
          strokeWidth={1.5}
          className="text-accent"
        />
      </div>
      <h3 className="m-0 text-[13.5px] font-semibold text-text-default">
        {t('title')}
      </h3>
      <p className="m-0 max-w-[260px] text-[12px] leading-[1.5] text-text-muted">
        {t('body')}
      </p>
    </div>
  );
}
