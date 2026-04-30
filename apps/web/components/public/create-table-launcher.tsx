'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { CreateTableSheet } from './create-table-sheet';
import type { Locale } from '@/i18n/config';

interface CreateTableLauncherProps {
  slug: string;
  locale: Locale;
}

const CTA_LABEL: Record<Locale, string> = {
  ka: 'მაგიდის შექმნა',
  en: 'Create Shared Table',
  ru: 'Создать общий стол',
};

export function CreateTableLauncher({ slug, locale }: CreateTableLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="public-create-table-cta"
        aria-label={CTA_LABEL[locale]}
        className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-2 rounded-full bg-text-default px-4 py-3 text-[13px] font-semibold text-card shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <Users size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>{CTA_LABEL[locale]}</span>
      </button>

      <CreateTableSheet
        slug={slug}
        locale={locale}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
