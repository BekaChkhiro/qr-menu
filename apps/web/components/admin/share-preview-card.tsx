'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { MenuWithDetails } from '@/types/menu';

interface SharePreviewCardProps {
  menu: MenuWithDetails;
  metaTitle: string;
  metaDescription: string;
  shareImageUrl: string | null;
}

export function SharePreviewCard({ menu, metaTitle, metaDescription, shareImageUrl }: SharePreviewCardProps) {
  const t = useTranslations('admin.editor.settings.seo');

  const { origin } = useMemo(() => {
    if (typeof window === 'undefined') return { origin: '' };
    return { origin: window.location.origin };
  }, []);

  const displayTitle = metaTitle || menu.name;
  const displayDescription = metaDescription || menu.description || t('fallbackDescription');
  const domain = origin ? new URL(origin).host.replace(/^www\./, '') : 'cafelinville.ge';

  return (
    <div className="w-full">
      <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.6px] text-text-subtle">
        {t('livePreviewLabel')}
      </div>

      <div
        data-testid="settings-share-preview"
        className="overflow-hidden rounded-[10px] border border-border bg-card"
      >
        {/* Card image */}
        <div className="relative aspect-[120/63] overflow-hidden">
          {shareImageUrl ? (
            <Image
              src={shareImageUrl}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="320px"
            />
          ) : menu.coverImageUrl ? (
            <Image
              src={menu.coverImageUrl}
              alt={displayTitle}
              fill
              className="object-cover"
              sizes="320px"
            />
          ) : (
            <div
              className="flex h-full w-full items-end p-4"
              style={{
                background: 'linear-gradient(135deg, #8B6F3A 0%, #B8864C 55%, #D4A574 100%)',
              }}
            >
              <div
                className="text-[22px] font-bold tracking-[-0.3px] text-white"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
              >
                {menu.name}
              </div>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-[14px]">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.4px] text-text-subtle">
            {domain}
          </div>
          <div className="mt-1 text-[14px] font-semibold leading-[1.3] text-text-default">
            {displayTitle}
          </div>
          <div className="mt-1 text-[12px] leading-[1.45] text-text-muted line-clamp-3">
            {displayDescription}
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-[1.45] text-text-subtle">
        {t('previewHint')}
      </p>
    </div>
  );
}
