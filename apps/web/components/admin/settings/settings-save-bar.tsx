'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { useSettingsForm } from './settings-form-context';

export function SettingsSaveBar() {
  const t = useTranslations('admin.settings.saveBar');
  const { isDirty, markClean } = useSettingsForm();

  if (!isDirty) {
    return null;
  }

  return (
    <div
      data-testid="settings-save-bar"
      data-dirty="true"
      role="region"
      aria-label={t('ariaLabel')}
      className="flex h-16 flex-shrink-0 items-center justify-between border-t border-border bg-card px-7"
    >
      <div className="flex min-h-[20px] items-center gap-2">
        <span
          aria-hidden
          className="h-[7px] w-[7px] rounded-full bg-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]"
        />
        <span className="text-[12.5px] font-medium text-text-default">{t('unsaved')}</span>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="settings-save-bar-discard"
          onClick={markClean}
        >
          {t('discard')}
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          data-testid="settings-save-bar-save"
          onClick={markClean}
        >
          {t('save')}
        </Button>
      </div>
    </div>
  );
}
