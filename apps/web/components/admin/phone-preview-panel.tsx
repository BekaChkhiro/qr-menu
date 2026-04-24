'use client';

import { useCallback, useMemo, useState } from 'react';
import { ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { PhonePreview } from '@/components/admin/phone-preview';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { locales, type Locale } from '@/i18n/config';
import type { Language, MenuStatus } from '@/types/menu';

interface PhonePreviewPanelProps {
  menu: {
    slug: string;
    enabledLanguages: Language[];
    status: MenuStatus;
  };
  /** Bump to force iframe reload (e.g. after a mutation). */
  refreshKey?: number;
  className?: string;
}

export function PhonePreviewPanel({
  menu,
  refreshKey,
  className,
}: PhonePreviewPanelProps) {
  const t = useTranslations('admin.editor.preview');
  const [locale, setLocale] = useState<Locale>('ka');

  // Resolve enabled locales from menu config, ensure KA is always first/primary.
  const enabledLocales = useMemo<Locale[]>(() => {
    const fromMenu = (menu.enabledLanguages ?? ['KA'])
      .map((l) => l.toLowerCase())
      .filter((l): l is Locale => (locales as readonly string[]).includes(l));
    const withKa = fromMenu.includes('ka') ? fromMenu : ['ka', ...fromMenu];
    // Preserve canonical KA → EN → RU ordering.
    return (locales as readonly Locale[]).filter((l) => withKa.includes(l));
  }, [menu.enabledLanguages]);

  // Drop the current selection back to KA if the menu just disabled its locale.
  const activeLocale: Locale = enabledLocales.includes(locale) ? locale : 'ka';

  const isPublished = menu.status === 'PUBLISHED';
  // `preview=true&draft=true` tells the public page to fetch DRAFTs as the
  // authenticated owner. `locale` overrides the cookie for this iframe only.
  const iframeUrl = `/m/${menu.slug}?preview=true&draft=true&locale=${activeLocale}`;

  const handleShare = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.clipboard) return;
    const url = `${window.location.origin}/m/${menu.slug}`;
    void navigator.clipboard.writeText(url);
    toast.success(t('shareCopied'));
  }, [menu.slug, t]);

  const handleViewPublic = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open(
      `${window.location.origin}/m/${menu.slug}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, [menu.slug]);

  return (
    <div
      data-testid="phone-preview-panel"
      data-active-locale={activeLocale}
      className={cn(
        'flex flex-col items-center rounded-[12px] border border-border bg-bg px-4 pb-5 pt-4',
        className,
      )}
    >
      {/* Header row: language tabs + Share / View public */}
      <div className="mb-[18px] flex w-full items-center justify-between gap-2">
        <div
          role="radiogroup"
          aria-label={t('languageTabs')}
          data-testid="preview-language-tabs"
          className="inline-flex items-center rounded-[7px] border border-border bg-card p-[2px]"
        >
          {enabledLocales.map((l) => {
            const isActive = activeLocale === l;
            return (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={isActive}
                data-testid={`preview-locale-${l}`}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => setLocale(l)}
                className={cn(
                  'rounded-[5px] px-3 py-[4px] text-[12px] font-semibold transition-colors',
                  isActive
                    ? 'bg-text-default text-white'
                    : 'text-text-muted hover:text-text-default',
                )}
              >
                {l.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-[6px]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leadingIcon={Share2}
            data-testid="preview-share"
            onClick={handleShare}
          >
            {t('share')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leadingIcon={ExternalLink}
            data-testid="preview-view-public"
            onClick={handleViewPublic}
            disabled={!isPublished}
            title={isPublished ? undefined : t('viewPublicDisabled')}
          >
            {t('viewPublic')}
          </Button>
        </div>
      </div>

      {/* Phone frame (iframe to public menu route) */}
      <PhonePreview url={iframeUrl} refreshKey={refreshKey} />

      {/* Real-time hint with pulse dot */}
      <div
        data-testid="preview-realtime-hint"
        className="mt-4 inline-flex items-center gap-[7px] text-[11.5px] text-text-muted"
      >
        <span
          aria-hidden="true"
          data-testid="preview-pulse-dot"
          className="h-[7px] w-[7px] animate-pulse rounded-full bg-success shadow-[0_0_0_3px_hsl(var(--success-soft))]"
        />
        {t('realtimeHint')}
      </div>
    </div>
  );
}
