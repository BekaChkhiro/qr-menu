'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { MenuCard } from './menu-card';
import { MenuGridSkeleton } from './menu-card-skeleton';
import { useMenus, useDeleteMenu, usePublishMenu } from '@/hooks/use-menus';
import type { Menu } from '@/types/menu';

export function MenusList() {
  const router = useRouter();
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [menuToToggle, setMenuToToggle] = useState<Menu | null>(null);
  const t = useTranslations('admin.menus');
  const tActions = useTranslations('actions');

  const { data, isLoading, error } = useMenus();
  const deleteMenu = useDeleteMenu();

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
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">{t('empty.title')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('empty.description')}
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/menus/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('empty.action')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu) => (
          <MenuCardWithPublish
            key={menu.id}
            menu={menu}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePublish={handleTogglePublish}
          />
        ))}
      </div>

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
