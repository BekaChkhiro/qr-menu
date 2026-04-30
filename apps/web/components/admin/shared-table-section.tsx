'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { useUpdateMenu } from '@/hooks/use-menus';
import type { MenuWithDetails } from '@/types/menu';

interface SharedTableSectionProps {
  menu: MenuWithDetails;
}

export function SharedTableSection({ menu }: SharedTableSectionProps) {
  const t = useTranslations('admin.editor.settings.sharedTable');
  const updateMenu = useUpdateMenu(menu.id);

  const [enabled, setEnabled] = useState(menu.sharedTableEnabled);

  // Sync if the menu refetches with a different value (e.g., another tab).
  const lastSyncedRef = useRef(menu.sharedTableEnabled);
  useEffect(() => {
    if (lastSyncedRef.current !== menu.sharedTableEnabled) {
      setEnabled(menu.sharedTableEnabled);
      lastSyncedRef.current = menu.sharedTableEnabled;
    }
  }, [menu.sharedTableEnabled]);

  const handleToggle = async (next: boolean) => {
    const previous = enabled;
    setEnabled(next); // optimistic
    try {
      await updateMenu.mutateAsync({ sharedTableEnabled: next });
      lastSyncedRef.current = next;
      toast.success(next ? t('toastEnabled') : t('toastDisabled'));
    } catch (err) {
      setEnabled(previous);
      const apiError = err as { message?: string; code?: string };
      toast.error(apiError?.message || t('toastError'));
    }
  };

  return (
    <div
      data-testid="settings-shared-table"
      data-enabled={enabled ? 'true' : 'false'}
      className="rounded-[12px] border border-border bg-card px-5 py-[18px]"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <Users className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold tracking-[-0.1px] text-text-default">
            {t('title')}
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-text-muted">
            {t('body')}
          </p>
          {enabled && (
            <p className="mt-2 text-[12px] leading-[1.5] text-text-subtle">
              {t('disableHint')}
            </p>
          )}
        </div>

        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={updateMenu.isPending}
          aria-label={t('switchAriaLabel')}
          data-testid="settings-shared-table-switch"
        />
      </div>
    </div>
  );
}
