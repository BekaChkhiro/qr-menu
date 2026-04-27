'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy, Archive, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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
import { useCloneMenu, useUpdateMenu, useDeleteMenu } from '@/hooks/use-menus';
import type { MenuWithDetails } from '@/types/menu';

interface MenuAdvancedSectionProps {
  menu: MenuWithDetails;
}

export function MenuAdvancedSection({ menu }: MenuAdvancedSectionProps) {
  const router = useRouter();
  const t = useTranslations('admin.editor.settings.advanced');
  const tActions = useTranslations('actions');

  const cloneMenu = useCloneMenu();
  const updateMenu = useUpdateMenu(menu.id);
  const deleteMenu = useDeleteMenu();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleClone = async () => {
    try {
      const cloned = await cloneMenu.mutateAsync(menu.id);
      toast.success(t('cloneSuccess', { name: cloned.name }));
      router.push(`/admin/menus/${cloned.id}?tab=settings`);
    } catch {
      toast.error(t('cloneError'));
    }
  };

  const handleArchive = async () => {
    try {
      await updateMenu.mutateAsync({ status: 'ARCHIVED' });
      toast.success(t('archiveSuccess'));
    } catch {
      toast.error(t('archiveError'));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMenu.mutateAsync(menu.id);
      setShowDeleteDialog(false);
      toast.success(t('deleteSuccess'));
      router.push('/admin/menus');
    } catch {
      toast.error(t('deleteError'));
    }
  };

  const isArchiving = updateMenu.isPending && updateMenu.variables?.status === 'ARCHIVED';

  return (
    <div data-testid="settings-advanced">
      {/* Clone + Archive actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={Copy}
          onClick={handleClone}
          disabled={cloneMenu.isPending}
          data-testid="settings-advanced-clone"
        >
          {cloneMenu.isPending ? (
            <>
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
              {t('cloning')}
            </>
          ) : (
            t('clone')
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={Archive}
          onClick={handleArchive}
          disabled={isArchiving}
          data-testid="settings-advanced-archive"
        >
          {isArchiving ? (
            <>
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
              {t('archiving')}
            </>
          ) : (
            t('archive')
          )}
        </Button>
      </div>

      {/* Danger zone */}
      <div
        className="flex items-start gap-4 rounded-[10px] border border-danger/20 bg-card p-4"
        data-testid="settings-advanced-danger-zone"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-danger-soft text-danger">
          <AlertTriangle size={15} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-text-default">
            {t('deleteTitle')}
          </div>
          <div className="mt-1 text-[12px] leading-[1.5] text-text-muted">
            {t('deleteDescription', { name: menu.name })}
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          leadingIcon={Trash2}
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleteMenu.isPending}
          data-testid="settings-advanced-delete"
        >
          {t('deleteButton')}
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="settings-advanced-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription', { name: menu.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMenu.isPending}>
              {tActions('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMenu.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="settings-advanced-delete-confirm"
            >
              {deleteMenu.isPending ? (
                <>
                  <Loader2 size={13} strokeWidth={1.5} className="mr-1 animate-spin" />
                  {tActions('loading')}
                </>
              ) : (
                t('deleteConfirmButton')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
