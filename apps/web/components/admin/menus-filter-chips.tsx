'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

export type MenusFilterKey = 'all' | 'published' | 'draft' | 'archived';

export interface MenusFilterCounts {
  all: number;
  published: number;
  draft: number;
  archived: number;
}

export interface MenusFilterChipsProps {
  filter: MenusFilterKey;
  onFilterChange: (next: MenusFilterKey) => void;
  counts: MenusFilterCounts;
  query: string;
  onQueryChange: (next: string) => void;
}

const FILTERS: ReadonlyArray<{
  key: MenusFilterKey;
  testId: string;
  labelKey: 'all' | 'published' | 'draft' | 'archived';
}> = [
  { key: 'all', testId: 'menus-filter-all', labelKey: 'all' },
  { key: 'published', testId: 'menus-filter-published', labelKey: 'published' },
  { key: 'draft', testId: 'menus-filter-draft', labelKey: 'draft' },
  { key: 'archived', testId: 'menus-filter-archived', labelKey: 'archived' },
];

export function MenusFilterChips({
  filter,
  onFilterChange,
  counts,
  query,
  onQueryChange,
}: MenusFilterChipsProps) {
  const t = useTranslations('admin.menus.filter');

  return (
    <div
      data-testid="menus-filter-bar"
      className="flex flex-wrap items-center gap-3"
    >
      <div
        role="radiogroup"
        aria-label={t('groupLabel')}
        className="flex flex-wrap gap-1.5"
      >
        {FILTERS.map(({ key, testId, labelKey }) => (
          <FilterPill
            key={key}
            label={t(labelKey)}
            count={counts[key]}
            active={filter === key}
            onClick={() => onFilterChange(key)}
            testId={testId}
          />
        ))}
      </div>

      <label className="ml-auto flex w-full items-center gap-2 rounded-[7px] border border-border bg-[#FCFBF8] px-2.5 py-[5px] sm:w-[240px]">
        <Search
          size={13}
          strokeWidth={1.5}
          className="shrink-0 text-text-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          data-testid="menus-search"
          aria-label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full bg-transparent text-[12px] text-text-default placeholder:text-text-subtle focus:outline-none"
        />
      </label>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
  testId,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-testid={testId}
      data-active={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-[11px] py-[5px] text-[12px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        active
          ? 'border-text-default bg-text-default text-white'
          : 'border-border bg-white text-text-default hover:border-text-subtle',
      )}
    >
      {label}
      <span
        className={cn(
          'inline-flex min-w-[16px] justify-center rounded-[4px] px-[5px] text-[10.5px] font-semibold tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-chip text-text-muted',
        )}
      >
        {count}
      </span>
    </button>
  );
}
