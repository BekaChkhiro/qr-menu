'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Lock, Sparkles, Users } from 'lucide-react';

export function SharedTableLocked() {
  const t = useTranslations('admin.editor.settings.sharedTableLocked');

  return (
    <div
      className="relative overflow-hidden rounded-[12px] border border-border bg-card"
      data-testid="settings-shared-table-locked"
      role="group"
      aria-labelledby="shared-table-locked-title"
    >
      <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <Users className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Lock className="h-[12px] w-[12px] text-text-muted" strokeWidth={1.8} aria-hidden="true" />
            <div
              id="shared-table-locked-title"
              className="text-[13.5px] font-semibold tracking-[-0.1px] text-text-default"
            >
              {t('title')}
            </div>
          </div>
          <p className="mt-1 text-[12.5px] leading-[1.5] text-text-muted">
            {t('body')}
          </p>
        </div>

        <Link
          href="/admin/settings/billing"
          data-testid="settings-shared-table-locked-cta"
          className={
            'inline-flex h-[32px] flex-shrink-0 items-center justify-center gap-[6px] rounded-[7px] ' +
            'border border-text-default bg-text-default px-[13px] text-[12.5px] font-medium text-white ' +
            'transition-colors hover:bg-text-default/90 active:bg-text-default/80 ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
          }
        >
          <Sparkles size={13} strokeWidth={1.5} aria-hidden="true" />
          {t('cta')}
        </Link>
      </div>
    </div>
  );
}
