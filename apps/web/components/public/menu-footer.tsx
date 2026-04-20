'use client';

import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';
import { AllergenLegend } from './allergen-legend';

interface MenuFooterProps {
  locale: Locale;
  currencySymbol?: string;
  allergenMode?: 'TEXT' | 'ICON' | 'WARNING';
  hasAllergens?: boolean;
}

const translations = {
  ka: {
    createdWith: 'შექმნილია',
    digitalMenu: 'Digital Menu',
    backToTop: 'დაბრუნება',
    pricesIn: 'ფასები',
    currency: 'ლარში',
  },
  en: {
    createdWith: 'Created with',
    digitalMenu: 'Digital Menu',
    backToTop: 'Back to top',
    pricesIn: 'Prices in',
    currency: '',
  },
  ru: {
    createdWith: 'Создано с помощью',
    digitalMenu: 'Digital Menu',
    backToTop: 'Наверх',
    pricesIn: 'Цены в',
    currency: '',
  },
};

export function MenuFooter({
  locale,
  currencySymbol = '₾',
  allergenMode,
  hasAllergens = false,
}: MenuFooterProps) {
  const t = translations[locale];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currencyLabel =
    locale === 'ka'
      ? `${t.pricesIn} ${t.currency}`
      : `${t.pricesIn} ${currencySymbol}`;

  return (
    <footer className="border-t bg-gradient-to-t from-muted/50 to-transparent">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="gap-2 rounded-full px-5 touch-feedback transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowUp className="h-4 w-4" />
            {t.backToTop}
          </Button>

          {/* Legal + practical disclosures */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>{currencyLabel}</span>
            {hasAllergens && allergenMode && allergenMode !== 'TEXT' && (
              <>
                <span aria-hidden>·</span>
                <AllergenLegend locale={locale} mode={allergenMode} />
              </>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {t.createdWith}{' '}
            <a
              href="/"
              className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.digitalMenu}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
