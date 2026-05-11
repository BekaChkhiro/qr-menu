'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { LogoSize, LogoAlignment } from '@/types/menu';

interface MenuHeaderProps {
  name: string;
  description: string | null;
  logoUrl: string | null;
  logoSize?: LogoSize;
  logoAlignment?: LogoAlignment;
  locale: Locale;
  enabledLocales?: Locale[];
}

// T21.4 — height tokens. `imageSizes` matches the rendered pixel box so
// next/image picks the right candidate from `srcSet`.
const LOGO_SIZE_CLASSES: Record<LogoSize, string> = {
  SMALL: 'h-12 w-12',
  MEDIUM: 'h-20 w-20',
  LARGE: 'h-32 w-32',
};

const LOGO_IMAGE_SIZES: Record<LogoSize, string> = {
  SMALL: '48px',
  MEDIUM: '80px',
  LARGE: '128px',
};

const ALIGNMENT_CLASSES: Record<LogoAlignment, string> = {
  LEFT: 'justify-start',
  CENTER: 'justify-center',
  RIGHT: 'justify-end',
};

const TEXT_ALIGN_CLASSES: Record<LogoAlignment, string> = {
  LEFT: 'text-left',
  CENTER: 'text-center',
  RIGHT: 'text-right',
};

export function MenuHeader({
  name,
  description,
  logoUrl,
  logoSize = 'MEDIUM',
  logoAlignment = 'CENTER',
  locale,
  enabledLocales,
}: MenuHeaderProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const languageLabel =
    locale === 'ka' ? 'ენის არჩევა' : locale === 'ru' ? 'Выбор языка' : 'Select language';

  const showLogo = Boolean(logoUrl) && !imageError;

  return (
    <header
      className="sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b shadow-sm"
      role="banner"
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative">
          <div className="absolute right-0 top-0" aria-label={languageLabel}>
            <LanguageSwitcher
              currentLocale={locale}
              variant="compact"
              enabledLocales={enabledLocales}
              triggerTestId="public-menu-language-switcher"
            />
          </div>

          {showLogo && (
            <div
              data-testid="public-menu-logo-row"
              className={cn(
                'flex w-full items-center',
                ALIGNMENT_CLASSES[logoAlignment],
              )}
            >
              <div
                className={cn(
                  'relative flex-shrink-0 rounded-full overflow-hidden border-2 border-border/50 bg-muted shadow-sm',
                  LOGO_SIZE_CLASSES[logoSize],
                )}
              >
                {!imageLoaded && (
                  <Skeleton className="absolute inset-0 rounded-full" aria-hidden="true" />
                )}
                <Image
                  data-testid="public-menu-logo"
                  src={logoUrl as string}
                  alt={`${name} logo`}
                  fill
                  className={cn(
                    'object-cover transition-opacity duration-300',
                    imageLoaded ? 'opacity-100' : 'opacity-0',
                  )}
                  sizes={LOGO_IMAGE_SIZES[logoSize]}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  priority
                />
              </div>
            </div>
          )}

          <div
            className={cn(
              'min-w-0',
              showLogo ? 'mt-2' : '',
              TEXT_ALIGN_CLASSES[logoAlignment],
              // Reserve space so the absolutely positioned language switcher
              // doesn't overlap the title on small screens.
              !showLogo ? 'pr-12' : '',
            )}
          >
            <h1 className="text-lg font-bold truncate tracking-tight">{name}</h1>
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
