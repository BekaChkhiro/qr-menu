'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  Globe,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { StatusPill, type StatusPillStatus } from '@/components/ui/status-pill';
import { SortHeader, type SortDirection } from '@/components/ui/sort-header';
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuItem,
  KebabMenuSeparator,
  KebabMenuTrigger,
} from '@/components/ui/kebab-menu';
import { MenuThumb } from './menu-thumb';
import type { Menu } from '@/types/menu';

export type MenusTableSortKey = 'name' | 'views7d';

export interface MenusTableSort {
  key: MenusTableSortKey;
  direction: Exclude<SortDirection, null>;
}

interface MenusTableProps {
  menus: Menu[];
  sort: MenusTableSort | null;
  onSortChange: (sort: MenusTableSort | null) => void;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  onTogglePublish: (menu: Menu) => void;
}

function statusToPill(status: Menu['status']): StatusPillStatus {
  if (status === 'PUBLISHED') return 'published';
  if (status === 'ARCHIVED') return 'archived';
  return 'draft';
}

function views7dFor(menu: Menu): number {
  return menu._count?.viewsLast7Days ?? 0;
}

// Grid: thumb · menu · status · categories · items · views 7d · last edited · kebab
// 1fr share is reserved for the Menu column so the row keeps its structure
// when the viewport narrows.
const GRID_TEMPLATE =
  'grid-cols-[40px_minmax(0,2fr)_110px_90px_80px_110px_130px_32px]';

export function MenusTable({
  menus,
  sort,
  onSortChange,
  onEdit,
  onDelete,
  onTogglePublish,
}: MenusTableProps) {
  const router = useRouter();
  const t = useTranslations('admin.menus');
  const tTable = useTranslations('admin.menus.table');
  const tCard = useTranslations('admin.menus.card');
  const tActions = useTranslations('actions');
  const tA11y = useTranslations('common.accessibility');

  const sortedMenus = useMemo(() => {
    if (!sort) return menus;
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...menus].sort((a, b) => {
      if (sort.key === 'name') {
        return a.name.localeCompare(b.name) * sign;
      }
      // views7d
      return (views7dFor(a) - views7dFor(b)) * sign;
    });
  }, [menus, sort]);

  const directionFor = (key: MenusTableSortKey): SortDirection =>
    sort?.key === key ? sort.direction : null;

  const handleSort = (key: MenusTableSortKey) => (next: SortDirection) => {
    if (next === null) {
      onSortChange(null);
    } else {
      onSortChange({ key, direction: next });
    }
  };

  return (
    <div
      data-testid="menus-table"
      className="overflow-hidden rounded-[12px] border border-border bg-card"
    >
      {/* Header row */}
      <div
        role="row"
        className={cn(
          'grid items-center gap-[14px] px-5 py-[10px]',
          GRID_TEMPLATE,
          'border-b border-[hsl(var(--border-soft))] bg-[hsl(var(--sidebar))]',
        )}
      >
        <span aria-hidden="true" />
        <SortHeader
          label={tTable('columns.menu')}
          direction={directionFor('name')}
          onSortChange={handleSort('name')}
          data-testid="menus-table-sort-name"
        />
        <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-text-subtle">
          {tTable('columns.status')}
        </span>
        <span className="text-right text-[11px] font-bold uppercase tracking-[0.6px] text-text-subtle">
          {tTable('columns.categories')}
        </span>
        <span className="text-right text-[11px] font-bold uppercase tracking-[0.6px] text-text-subtle">
          {tTable('columns.items')}
        </span>
        <span className="flex justify-end">
          <SortHeader
            label={tTable('columns.views7d')}
            direction={directionFor('views7d')}
            onSortChange={handleSort('views7d')}
            data-testid="menus-table-sort-views"
          />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-text-subtle">
          {tTable('columns.lastEdited')}
        </span>
        <span aria-hidden="true" />
      </div>

      {/* Body rows */}
      {sortedMenus.map((menu, index) => {
        const isPublished = menu.status === 'PUBLISHED';
        const views7d = views7dFor(menu);
        const isLast = index === sortedMenus.length - 1;
        const publicUrl = `/m/${menu.slug}`;
        const editedLabel = (() => {
          try {
            return formatDistanceToNow(new Date(menu.updatedAt), {
              addSuffix: true,
            });
          } catch {
            return '';
          }
        })();

        return (
          <div
            key={menu.id}
            role="row"
            data-testid="menus-table-row"
            data-menu-id={menu.id}
            className={cn(
              'grid items-center gap-[14px] px-5 py-[11px]',
              GRID_TEMPLATE,
              !isLast && 'border-b border-[hsl(var(--border-soft))]',
              'transition-colors hover:bg-[hsl(var(--bg))]',
            )}
            onClick={() => router.push(`/admin/menus/${menu.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(`/admin/menus/${menu.id}`);
              }
            }}
            tabIndex={0}
          >
            <MenuThumb menuId={menu.id} size={36} />
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-medium text-text-default">
                {menu.name}
              </div>
              <div className="mt-[1px] flex items-center gap-1 text-[11.5px] text-text-muted">
                <Globe size={10} strokeWidth={1.5} aria-hidden="true" />
                <span className="truncate">/m/{menu.slug}</span>
              </div>
            </div>
            <StatusPill status={statusToPill(menu.status)} />
            <span className="text-right text-[13px] tabular-nums text-text-default">
              {menu._count?.categories ?? 0}
            </span>
            <span className="text-right text-[13px] tabular-nums text-text-default">
              {menu._count?.products ?? 0}
            </span>
            <span
              data-testid="menus-table-views"
              className={cn(
                'text-right text-[13px] tabular-nums',
                views7d > 0
                  ? 'font-medium text-text-default'
                  : 'text-text-subtle',
              )}
            >
              {views7d > 0 ? views7d.toLocaleString() : '—'}
            </span>
            <span className="truncate text-[12.5px] text-text-muted">
              {editedLabel}
            </span>
            <div
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <KebabMenu>
                <KebabMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={tA11y('menuActions')}
                    data-testid="menus-table-kebab"
                    className={cn(
                      'flex h-[26px] w-[26px] items-center justify-center rounded-md text-text-muted',
                      'transition-colors hover:bg-[hsl(var(--chip))] hover:text-text-default',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    )}
                  >
                    <MoreHorizontal
                      size={15}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </button>
                </KebabMenuTrigger>
                <KebabMenuContent>
                  <KebabMenuItem icon={Edit} onSelect={() => onEdit(menu)}>
                    {tActions('edit')}
                  </KebabMenuItem>
                  <KebabMenuItem
                    icon={FolderOpen}
                    onSelect={() => router.push(`/admin/menus/${menu.id}`)}
                  >
                    {tCard('manageContent')}
                  </KebabMenuItem>
                  <KebabMenuItem
                    icon={isPublished ? EyeOff : Eye}
                    onSelect={() => onTogglePublish(menu)}
                  >
                    {isPublished ? tActions('unpublish') : tActions('publish')}
                  </KebabMenuItem>
                  {isPublished && (
                    <KebabMenuItem
                      icon={ExternalLink}
                      onSelect={() =>
                        window.open(publicUrl, '_blank', 'noopener,noreferrer')
                      }
                    >
                      {tCard('viewMenu')}
                    </KebabMenuItem>
                  )}
                  <KebabMenuSeparator />
                  <KebabMenuItem
                    tone="destructive"
                    icon={Trash2}
                    onSelect={() => onDelete(menu)}
                  >
                    {tActions('delete')}
                  </KebabMenuItem>
                </KebabMenuContent>
              </KebabMenu>
            </div>
          </div>
        );
      })}

      {/* Empty-within-table state (grid is empty only when parent filters
          everything out; the primary empty state still lives in MenusList). */}
      {sortedMenus.length === 0 && (
        <div
          role="row"
          className="px-5 py-10 text-center text-[13px] text-text-muted"
        >
          {t('empty.title')}
        </div>
      )}
    </div>
  );
}
