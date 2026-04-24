'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMenuAnalytics } from '@/hooks/use-analytics';
import type { TopCategory } from '@/lib/validations/analytics';

interface TopCategoriesCardProps {
  menuId: string;
  hasAnalytics: boolean;
}

function pickCategoryName(cat: TopCategory, locale: string): string {
  if (locale === 'en' && cat.nameEn) return cat.nameEn;
  if (locale === 'ru' && cat.nameRu) return cat.nameRu;
  return cat.nameKa;
}

// Accent gradient per rank — rank 0 is pure accent, later rows fade.
// Shifting opacity instead of mixing colors keeps baselines stable.
function barOpacityForRank(rank: number): number {
  return Math.max(0.35, 1 - rank * 0.13);
}

export function TopCategoriesCard({ menuId, hasAnalytics }: TopCategoriesCardProps) {
  const t = useTranslations('admin.editor.analytics.topCategories');
  const locale = useLocale();
  const { data, isLoading } = useMenuAnalytics(menuId, { period: '30d' });

  const rows = data?.topCategories ?? [];
  const maxCount = rows.length > 0 ? rows[0].count : 0;

  return (
    <section
      data-testid="editor-analytics-top-categories-card"
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
        <span
          data-testid="editor-analytics-top-categories-hint"
          className="text-[11.5px] text-text-subtle"
        >
          {t('hint')}
        </span>
      </header>

      <div className="p-[18px]">
        {isLoading ? (
          <TopCategoriesSkeleton />
        ) : rows.length === 0 ? (
          <p
            data-testid="editor-analytics-top-categories-empty"
            className="py-6 text-center text-[12.5px] text-text-muted"
          >
            {t('empty')}
          </p>
        ) : (
          <ul
            data-testid="editor-analytics-top-categories-rows"
            className="m-0 flex flex-col gap-2.5 p-0"
          >
            {rows.map((row, rank) => {
              const width = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
              const name = pickCategoryName(row, locale);
              return (
                <li
                  key={row.categoryId}
                  data-testid="editor-analytics-top-categories-row"
                  data-category-id={row.categoryId}
                  data-rank={rank + 1}
                  className="flex items-center gap-3"
                >
                  <span
                    title={name}
                    className="w-[72px] shrink-0 truncate text-[12.5px] font-medium text-text-default"
                  >
                    {name}
                  </span>
                  <div
                    className="relative h-[22px] flex-1 overflow-hidden rounded-[4px] bg-chip"
                    role="presentation"
                  >
                    <div
                      data-testid="editor-analytics-top-categories-bar"
                      className="absolute inset-y-0 left-0 rounded-[4px] bg-accent"
                      style={{
                        width: `${width}%`,
                        opacity: barOpacityForRank(rank),
                      }}
                    />
                  </div>
                  <span
                    data-testid="editor-analytics-top-categories-count"
                    className="w-[60px] shrink-0 text-right text-[12.5px] font-semibold text-text-default tabular-nums"
                  >
                    {row.count.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function TopCategoriesSkeleton() {
  return (
    <div
      data-testid="editor-analytics-top-categories-skeleton"
      className="flex flex-col gap-2.5"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-[56px]" />
          <Skeleton className="h-[22px] flex-1 rounded-[4px]" />
          <Skeleton className="ml-auto h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
