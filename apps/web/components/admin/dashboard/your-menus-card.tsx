'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ka, ru } from 'date-fns/locale';
import {
  BarChart3,
  Copy,
  Pencil,
  Globe,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatusPill, type StatusPillStatus } from '@/components/ui/status-pill';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuIconTrigger,
  KebabMenuItem,
  KebabMenuSeparator,
} from '@/components/ui/kebab-menu';
import { useDeleteMenu } from '@/hooks/use-menus';

// Deterministic thumbnail palette — matches menu-card.tsx so grid + row
// thumbnails share tones across the admin.
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

export type YourMenusFilter = 'all' | 'published' | 'draft';

export interface YourMenuRow {
  id: string;
  name: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  viewsToday: number;
  viewsWeek: number;
  /** ISO date string — serialised from server component. */
  updatedAt: string;
}

export interface YourMenusCardProps {
  menus: YourMenuRow[];
}

const LOCALE_MAP = { en: enUS, ka, ru } as const;

const TEMPLATE_KEYS = ['cafe', 'restaurant', 'bar'] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

const TEMPLATE_TONES: Record<TemplateKey, readonly [string, string]> = {
  cafe: THUMB_TONES[0],
  restaurant: THUMB_TONES[1],
  bar: THUMB_TONES[2],
};

function statusToPill(status: YourMenuRow['status']): StatusPillStatus {
  return status === 'PUBLISHED' ? 'published' : 'draft';
}

function MenuThumbnail({
  id,
  name,
  size = 38,
}: {
  id: string;
  name: string;
  size?: number;
}) {
  const [c1, c2] = toneFor(id);
  return (
    <div
      aria-label={name}
      role="img"
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
    >
      <UtensilsCrossed
        aria-hidden="true"
        size={Math.round(size * 0.46)}
        strokeWidth={1.5}
        className="text-white/75"
      />
    </div>
  );
}

export function YourMenusCard({ menus }: YourMenusCardProps) {
  const t = useTranslations('admin.dashboard.yourMenus');
  const locale = useLocale() as keyof typeof LOCALE_MAP;
  const dateLocale = LOCALE_MAP[locale] ?? enUS;

  const [filter, setFilter] = React.useState<YourMenusFilter>('all');
  const [query, setQuery] = React.useState('');
  const [menuToDelete, setMenuToDelete] = React.useState<YourMenuRow | null>(
    null,
  );

  const router = useRouter();
  const deleteMenu = useDeleteMenu();

  const counts = React.useMemo(() => {
    let published = 0;
    let draft = 0;
    for (const m of menus) {
      if (m.status === 'PUBLISHED') published += 1;
      else draft += 1;
    }
    return { all: menus.length, published, draft };
  }, [menus]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return menus.filter((m) => {
      if (filter === 'published' && m.status !== 'PUBLISHED') return false;
      if (filter === 'draft' && m.status !== 'DRAFT') return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q)
      );
    });
  }, [menus, filter, query]);

  const handleConfirmDelete = async () => {
    if (!menuToDelete) return;
    try {
      await deleteMenu.mutateAsync(menuToDelete.id);
    } catch {
      // error toast is not part of T11.6 scope; keep the dialog open so the
      // user can retry or cancel. useDeleteMenu surfaces the error via the
      // mutation `error` field for future wiring.
      return;
    }
    setMenuToDelete(null);
  };

  if (menus.length === 0) {
    return <YourMenusEmpty />;
  }

  return (
    <>
      <section
        data-testid="dashboard-your-menus"
        aria-label={t('title')}
        className="overflow-hidden rounded-[12px] border border-border bg-card"
      >
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[hsl(var(--border-soft))] px-5 py-[14px]">
          <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-text-default">
            {t('title')}
          </h2>

          <div
            role="radiogroup"
            aria-label={t('title')}
            className="flex gap-1.5"
          >
            <FilterPill
              label={t('filter.all')}
              count={counts.all}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              testId="dashboard-menus-filter-all"
            />
            <FilterPill
              label={t('filter.published')}
              count={counts.published}
              active={filter === 'published'}
              onClick={() => setFilter('published')}
              testId="dashboard-menus-filter-published"
            />
            <FilterPill
              label={t('filter.draft')}
              count={counts.draft}
              active={filter === 'draft'}
              onClick={() => setFilter('draft')}
              testId="dashboard-menus-filter-draft"
            />
          </div>

          <label className="ml-auto flex w-[220px] items-center gap-2 rounded-[7px] border border-border bg-[#FCFBF8] px-2.5 py-[5px]">
            <Search
              size={13}
              strokeWidth={1.5}
              className="text-text-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              data-testid="dashboard-menus-search"
              aria-label={t('searchLabel')}
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[12px] text-text-default placeholder:text-text-subtle focus:outline-none"
            />
          </label>
        </div>

        {/* ── Column headers ── */}
        <div
          role="row"
          className="grid items-center gap-[14px] border-b border-[hsl(var(--border-soft))] bg-[#FCFBF8] px-5 py-[9px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-text-subtle"
          style={{
            gridTemplateColumns: '40px 1fr 110px 150px 120px 32px',
          }}
        >
          <span aria-hidden="true" />
          <span role="columnheader">{t('columns.menu')}</span>
          <span role="columnheader">{t('columns.status')}</span>
          <span role="columnheader">{t('columns.views')}</span>
          <span role="columnheader">{t('columns.lastEdited')}</span>
          <span className="sr-only" role="columnheader">
            {t('columns.actions')}
          </span>
        </div>

        {/* ── Rows ── */}
        {filtered.length === 0 ? (
          <div
            data-testid="dashboard-menus-no-results"
            className="px-5 py-10 text-center text-[13px] text-text-muted"
          >
            {t('noResults')}
          </div>
        ) : (
          <ul data-testid="dashboard-menus-rows" className="m-0 list-none p-0">
            {filtered.map((menu, i) => (
              <li
                key={menu.id}
                data-testid="dashboard-menus-row"
                data-menu-id={menu.id}
                data-menu-status={menu.status}
                className={cn(
                  'grid items-center gap-[14px] px-5 py-3',
                  i !== filtered.length - 1 &&
                    'border-b border-[hsl(var(--border-soft))]',
                )}
                style={{
                  gridTemplateColumns: '40px 1fr 110px 150px 120px 32px',
                }}
              >
                <MenuThumbnail id={menu.id} name={menu.name} />

                <div className="min-w-0">
                  <Link
                    href={`/admin/menus/${menu.id}`}
                    data-testid="dashboard-menus-row-link"
                    className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-text-default hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {menu.name}
                  </Link>
                  <div className="mt-[2px] flex min-w-0 items-center gap-[5px] text-[11.5px] text-text-muted">
                    <Globe
                      size={11}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="shrink-0"
                    />
                    <span className="truncate">/m/{menu.slug}</span>
                  </div>
                </div>

                <StatusPill status={statusToPill(menu.status)} />

                <div
                  className="text-[13px] tabular-nums text-text-default"
                  aria-label={t('viewsAria', {
                    today: menu.viewsToday,
                    week: menu.viewsWeek,
                  })}
                >
                  <span className="font-medium">
                    {menu.viewsToday.toLocaleString()}
                  </span>
                  <span className="text-text-muted">
                    {' · '}
                    {menu.viewsWeek.toLocaleString()}
                  </span>
                </div>

                <div className="truncate text-[12.5px] text-text-muted">
                  {formatDistanceToNow(new Date(menu.updatedAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </div>

                <div className="flex justify-end">
                  <KebabMenu>
                    <KebabMenuIconTrigger
                      aria-label={t('actionsLabel', { name: menu.name })}
                      data-testid="dashboard-menus-row-kebab"
                    />
                    <KebabMenuContent>
                      <KebabMenuItem
                        icon={Pencil}
                        data-testid="dashboard-menus-row-edit"
                        onSelect={() => router.push(`/admin/menus/${menu.id}`)}
                      >
                        {t('kebab.edit')}
                      </KebabMenuItem>
                      <KebabMenuItem
                        icon={Copy}
                        data-testid="dashboard-menus-row-duplicate"
                        onSelect={() =>
                          router.push(`/admin/menus/new?duplicate=${menu.id}`)
                        }
                      >
                        {t('kebab.duplicate')}
                      </KebabMenuItem>
                      <KebabMenuItem
                        icon={BarChart3}
                        data-testid="dashboard-menus-row-analytics"
                        onSelect={() =>
                          router.push(
                            `/admin/menus/${menu.id}?tab=analytics`,
                          )
                        }
                      >
                        {t('kebab.analytics')}
                      </KebabMenuItem>
                      <KebabMenuSeparator />
                      <KebabMenuItem
                        tone="destructive"
                        icon={Trash2}
                        data-testid="dashboard-menus-row-delete"
                        onSelect={(event) => {
                          event.preventDefault();
                          setMenuToDelete(menu);
                        }}
                      >
                        {t('kebab.delete')}
                      </KebabMenuItem>
                    </KebabMenuContent>
                  </KebabMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog
        open={!!menuToDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMenu.isPending) setMenuToDelete(null);
        }}
      >
        <AlertDialogContent data-testid="dashboard-menus-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.message', { name: menuToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMenu.isPending}>
              {t('delete.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="dashboard-menus-delete-confirm"
              onClick={handleConfirmDelete}
              disabled={deleteMenu.isPending}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {deleteMenu.isPending ? t('delete.deleting') : t('delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── FilterPill ─────────────────────────────────────────────────────────────

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
        'inline-flex items-center gap-1.5 rounded-md px-[11px] py-[5px] text-[12px] font-medium transition-colors',
        'border',
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

// ─── Empty state ─────────────────────────────────────────────────────────────

function YourMenusEmpty() {
  const t = useTranslations('admin.dashboard.yourMenus.empty');
  const router = useRouter();

  const handleTemplateClick = (key: TemplateKey) => {
    router.push(`/admin/menus/new?template=${key}`);
  };

  return (
    <section
      data-testid="dashboard-your-menus-empty"
      className="rounded-[14px] border border-border bg-card px-8 py-10 text-center"
    >
      {/* Layered card illustration */}
      <div
        aria-hidden="true"
        className="relative mx-auto mb-[22px] h-[78px] w-[110px]"
      >
        <div
          className="absolute left-1 top-[10px] h-[60px] w-[68px] rounded-[7px]"
          style={{ background: '#F7EDE6', transform: 'rotate(-7deg)' }}
        />
        <div
          className="absolute right-1 top-[6px] h-[60px] w-[68px] rounded-[7px]"
          style={{ background: '#E8F0E8', transform: 'rotate(6deg)' }}
        />
        <div
          className="absolute left-1/2 top-0 flex h-[68px] w-[72px] -translate-x-1/2 items-center justify-center rounded-[8px] border border-border bg-white"
          style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}
        >
          <UtensilsCrossed size={22} strokeWidth={1.5} className="text-accent" />
        </div>
      </div>

      <h3 className="m-0 mb-2 text-[19px] font-semibold tracking-[-0.3px] text-text-default">
        {t('title')}
      </h3>
      <p className="mx-auto mb-5 max-w-[400px] text-[13.5px] leading-[1.55] text-text-muted">
        {t('body')}
      </p>

      <div
        data-testid="dashboard-menus-templates"
        className="mb-5 flex flex-wrap justify-center gap-[10px]"
      >
        {TEMPLATE_KEYS.map((key) => {
          const [c1, c2] = TEMPLATE_TONES[key];
          return (
            <button
              key={key}
              type="button"
              data-testid={`dashboard-menus-template-${key}`}
              onClick={() => handleTemplateClick(key)}
              className="w-[180px] cursor-pointer rounded-[10px] border border-border bg-[#FCFBF8] p-3 text-left transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 7,
                  background: `linear-gradient(135deg, ${c1}, ${c2})`,
                }}
              >
                <UtensilsCrossed
                  size={22}
                  strokeWidth={1.5}
                  className="text-white/75"
                />
              </div>
              <div className="mb-[2px] mt-[10px] text-[13px] font-semibold text-text-default">
                {t(`templates.${key}.name`)}
              </div>
              <div className="text-[11.5px] leading-[1.4] text-text-muted">
                {t(`templates.${key}.description`)}
              </div>
            </button>
          );
        })}
      </div>

      <Link
        href="/admin/menus/new"
        data-testid="dashboard-menus-create-from-scratch"
        className="inline-flex items-center gap-[7px] rounded-md bg-text-default px-[18px] py-[9px] text-[13px] font-medium text-white transition-colors hover:bg-text-default/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
        {t('createFromScratch')}
      </Link>
    </section>
  );
}
