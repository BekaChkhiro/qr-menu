'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { useSettingsForm } from './settings-form-context';

interface SettingsPlaceholderCardProps {
  tabKey: string;
}

export function SettingsPlaceholderCard({ tabKey }: SettingsPlaceholderCardProps) {
  const t = useTranslations('admin.settings.placeholder');
  const { markDirty } = useSettingsForm();
  const [value, setValue] = useState('');

  return (
    <div
      data-testid={`settings-placeholder-${tabKey}`}
      className="rounded-card border border-border bg-card p-6"
    >
      <p className="mb-4 text-[13px] leading-[1.5] text-text-muted">{t('body')}</p>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
          {t('demoLabel')}
        </span>
        <Input
          data-testid={`settings-placeholder-${tabKey}-input`}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (event.target.value.length > 0) {
              markDirty();
            }
          }}
          placeholder={t('demoPlaceholder')}
        />
        <span className="mt-1.5 block text-[11.5px] leading-[1.4] text-text-muted">
          {t('demoHint')}
        </span>
      </label>
    </div>
  );
}
