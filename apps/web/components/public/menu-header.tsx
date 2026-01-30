'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

interface MenuHeaderProps {
  name: string;
  description: string | null;
  logoUrl: string | null;
  locale: Locale;
}

export function MenuHeader({ name, description, logoUrl, locale }: MenuHeaderProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const languageLabel = locale === 'ka' ? 'ენის არჩევა' : locale === 'ru' ? 'Выбор языка' : 'Select language';

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b shadow-sm" role="banner">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl && !imageError && (
              <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden border-2 border-border/50 bg-muted shadow-sm">
                {!imageLoaded && (
                  <Skeleton className="absolute inset-0 rounded-full" aria-hidden="true" />
                )}
                <Image
                  src={logoUrl}
                  alt={`${name} logo`}
                  fill
                  className={cn(
                    'object-cover transition-opacity duration-300',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  sizes="48px"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  priority
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate tracking-tight">{name}</h1>
              {description && (
                <p className="text-sm text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div aria-label={languageLabel}>
            <LanguageSwitcher currentLocale={locale} variant="compact" />
          </div>
        </div>
      </div>
    </header>
  );
}
