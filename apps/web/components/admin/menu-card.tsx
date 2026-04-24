'use client';

import Link from 'next/link';
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
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPill, type StatusPillStatus } from '@/components/ui/status-pill';
import {
  KebabMenu,
  KebabMenuContent,
  KebabMenuItem,
  KebabMenuSeparator,
  KebabMenuTrigger,
} from '@/components/ui/kebab-menu';
import type { Menu } from '@/types/menu';

// Cover-art gradient palette from qr-menu-design/components/menus-pages.jsx.
// Each menu is assigned a deterministic tone via hash(menu.id) so the grid
// looks varied but stable across renders.
const COVER_TONES: ReadonlyArray<readonly [string, string]> = [
  ['#C9B28A', '#8B6F47'],
  ['#B8633D', '#7A3F27'],
  ['#6B7F6B', '#3F5B3F'],
  ['#8A7CA0', '#5D4F70'],
  ['#D4A373', '#8B5A2B'],
  ['#5D7A91', '#344C63'],
];

function toneFor(id: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return COVER_TONES[Math.abs(h) % COVER_TONES.length];
}

function statusToPill(status: Menu['status']): StatusPillStatus {
  if (status === 'PUBLISHED') return 'published';
  if (status === 'ARCHIVED') return 'archived';
  return 'draft';
}

interface MenuCardProps {
  menu: Menu;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  onTogglePublish: (menu: Menu) => void;
}

export function MenuCard({
  menu,
  onEdit,
  onDelete,
  onTogglePublish,
}: MenuCardProps) {
  const router = useRouter();
  const t = useTranslations('admin.menus.card');
  const tActions = useTranslations('actions');
  const tA11y = useTranslations('common.accessibility');

  const isPublished = menu.status === 'PUBLISHED';
  const publicUrl = `/m/${menu.slug}`;
  const [c1, c2] = toneFor(menu.id);
  const categoriesCount = menu._count?.categories ?? 0;
  const itemsCount = menu._count?.products ?? 0;
  const viewsCount = menu._count?.views ?? 0;

  return (
    <article
      role="article"
      aria-label={menu.name}
      data-testid="menu-card"
      className={cn(
        'group relative flex flex-col overflow-hidden',
        'rounded-[12px] border border-border bg-card',
        'transition-[transform,box-shadow,border-color] duration-150',
        'hover:-translate-y-[1px] hover:shadow-sm hover:border-accent',
        'focus-within:border-accent',
      )}
    >
      <Link
        href={`/admin/menus/${menu.id}`}
        aria-label={menu.name}
        data-testid="menu-card-link"
        className={cn(
          'flex flex-1 flex-col rounded-[12px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        )}
      >
        {/* ── Cover (16:9) ── */}
        <div
          aria-hidden="true"
          className="relative aspect-[16/9] w-full overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          {/* Diagonal stripe texture */}
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 12px, transparent 12px 24px)',
            }}
          />
          <UtensilsCrossed
            aria-hidden="true"
            className="absolute inset-0 m-auto text-white/75"
            size={40}
            strokeWidth={1.5}
          />

          {/* StatusPill overlay — decorative, does not intercept clicks */}
          <div className="pointer-events-none absolute left-2.5 top-2.5">
            <StatusPill status={statusToPill(menu.status)} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-[14px]">
          <h3
            id={`menu-title-${menu.id}`}
            className="text-[14.5px] font-semibold leading-tight tracking-[-0.01em] text-text-default"
          >
            {menu.name}
          </h3>
          <p className="mt-[3px] text-xs text-text-muted">
            {t('subtitle', {
              categories: categoriesCount,
              items: itemsCount,
            })}
          </p>

          {/* ── Footer ── */}
          <div
            className={cn(
              'mt-auto flex items-center justify-between gap-3 pt-3',
              'border-t border-[hsl(var(--border-soft))]',
              'text-[11.5px] text-text-muted',
            )}
          >
            <div className="flex min-w-0 items-center gap-1">
              <Globe size={11} strokeWidth={1.5} aria-hidden="true" />
              <span className="truncate">/m/{menu.slug}</span>
            </div>
            {isPublished && viewsCount > 0 && (
              <span className="whitespace-nowrap tabular-nums font-medium text-text-default">
                {viewsCount.toLocaleString()}{' '}
                <span className="font-normal text-text-muted">
                  {t('thisWeek')}
                </span>
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Kebab lives outside the anchor so clicks don't bubble to the card link. */}
      <div className="absolute right-2.5 top-2.5 z-10">
        <KebabMenu>
          <KebabMenuTrigger asChild>
            <button
              type="button"
              aria-label={tA11y('menuActions')}
              data-testid="menu-card-kebab"
              className={cn(
                'flex h-[26px] w-[26px] items-center justify-center',
                'rounded-md bg-white/95 text-text-default backdrop-blur-sm',
                'transition-colors hover:bg-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              )}
            >
              <MoreHorizontal size={14} strokeWidth={1.5} aria-hidden="true" />
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
              {t('manageContent')}
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
                onSelect={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
              >
                {t('viewMenu')}
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
    </article>
  );
}
