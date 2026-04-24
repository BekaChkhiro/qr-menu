'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MenusEmpty } from './menus-empty';
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
import { Segmented, SegmentedItem } from '@/components/ui/segmented';
import { MenuCard } from './menu-card';
import { MenuGridSkeleton } from './menu-card-skeleton';
import { MenusTable, type MenusTableSort } from './menus-table';
import {
  MenusFilterChips,
  type MenusFilterKey,
} from './menus-filter-chips';
import { useMenus, useDeleteMenu, usePublishMenu } from '@/hooks/use-menus';
import type { Menu } from '@/types/menu';

type ViewMode = 'grid' | 'table';
const VIEW_STORAGE_KEY = 'dm.admin.menus.view';

function readStoredView(): ViewMode {
  if (typeof window === 'undefined') return 'grid';
  const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
  return stored === 'table' ? 'table' : 'grid';
}

export function MenusList() {
  const router = useRouter();
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [menuToToggle, setMenuToToggle] = useState<Menu | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [sort, setSort] = useState<MenusTableSort | null>(null);
  const [filter, setFilter] = useState<MenusFilterKey>('all');
  const [query, setQuery] = useState('');
  const t = useTranslations('admin.menus');
  const tTable = useTranslations('admin.menus.table');
  const tFilter = useTranslations('admin.menus.filter');
  const tActions = useTranslations('actions');

  const { data, isLoading, error } = useMenus();
  const deleteMenu = useDeleteMenu();

  // Hydrate view preference from localStorage after mount so SSR markup
  // stays deterministic (grid by default).
  useEffect(() => {
    setView(readStoredView());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const handleEdit = (menu: Menu) => {
    router.push(`/admin/menus/${menu.id}/edit`);
  };

  const handleDelete = (menu: Menu) => {
    setMenuToDelete(menu);
  };

  const handleTogglePublish = (menu: Menu) => {
    setMenuToToggle(menu);
  };

  const confirmDelete = async () => {
    if (!menuToDelete) return;
    try {
      await deleteMenu.mutateAsync(menuToDelete.id);
    } finally {
      setMenuToDelete(null);
    }
  };

  if (isLoading) {
    return <MenuGridSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">{error.message}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          {tActions('tryAgain')}
        </Button>
      </div>
    );
  }

  const menus = data?.data || [];

  if (menus.length === 0) {
    return <MenusEmpty />;
  }

  const counts = {
    all: menus.length,
    published: menus.filter((m) => m.status === 'PUBLISHED').length,
    draft: menus.filter((m) => m.status === 'DRAFT').length,
    archived: menus.filter((m) => m.status === 'ARCHIVED').length,
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMenus = menus.filter((menu) => {
    if (filter === 'published' && menu.status !== 'PUBLISHED') return false;
    if (filter === 'draft' && menu.status !== 'DRAFT') return false;
    if (filter === 'archived' && menu.status !== 'ARCHIVED') return false;
    if (!normalizedQuery) return true;
    return menu.name.toLowerCase().includes(normalizedQuery);
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MenusFilterChips
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
          query={query}
          onQueryChange={setQuery}
        />
        <Segmented
          value={view}
          onValueChange={(next) => setView(next as ViewMode)}
          ariaLabel={tTable('toggleAriaLabel')}
          iconOnly
          data-testid="menus-view-toggle"
          className="self-end sm:self-auto"
        >
          <SegmentedItem
            value="grid"
            aria-label={tTable('toggleGrid')}
            data-testid="menus-view-toggle-grid"
          >
            <LayoutGrid size={14} strokeWidth={1.5} aria-hidden="true" />
          </SegmentedItem>
          <SegmentedItem
            value="table"
            aria-label={tTable('toggleTable')}
            data-testid="menus-view-toggle-table"
          >
            <List size={14} strokeWidth={1.5} aria-hidden="true" />
          </SegmentedItem>
        </Segmented>
      </div>

      {filteredMenus.length === 0 ? (
        <div
          data-testid="menus-no-results"
          className="rounded-[12px] border border-border bg-card px-6 py-12 text-center text-[13px] text-text-muted"
        >
          {tFilter('noResults')}
        </div>
      ) : view === 'grid' ? (
        <div
          data-testid="menus-grid"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredMenus.map((menu) => (
            <MenuCardWithPublish
              key={menu.id}
              menu={menu}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      ) : (
        <MenusTable
          menus={filteredMenus}
          sort={sort}
          onSortChange={setSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!menuToDelete}
        onOpenChange={(open) => !open && setMenuToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMenu.isPending}>
              {tActions('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMenu.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMenu.isPending ? tActions('loading') : t('delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish/Unpublish Confirmation Dialog */}
      <PublishDialog
        menu={menuToToggle}
        onClose={() => setMenuToToggle(null)}
      />
    </>
  );
}

interface MenuCardWithPublishProps {
  menu: Menu;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  onTogglePublish: (menu: Menu) => void;
}

function MenuCardWithPublish({
  menu,
  onEdit,
  onDelete,
  onTogglePublish,
}: MenuCardWithPublishProps) {
  return (
    <MenuCard
      menu={menu}
      onEdit={onEdit}
      onDelete={onDelete}
      onTogglePublish={onTogglePublish}
    />
  );
}

interface PublishDialogProps {
  menu: Menu | null;
  onClose: () => void;
}

function PublishDialog({ menu, onClose }: PublishDialogProps) {
  const publishMenu = usePublishMenu(menu?.id || '');
  const isPublished = menu?.status === 'PUBLISHED';
  const tActions = useTranslations('actions');

  const handleConfirm = async () => {
    if (!menu) return;
    try {
      await publishMenu.mutateAsync(!isPublished);
    } finally {
      onClose();
    }
  };

  return (
    <AlertDialog open={!!menu} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPublished ? tActions('unpublish') : tActions('publish')}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={publishMenu.isPending}>
            {tActions('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={publishMenu.isPending}
          >
            {publishMenu.isPending
              ? tActions('loading')
              : isPublished
              ? tActions('unpublish')
              : tActions('publish')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
