'use client';

import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

interface MenuFooterProps {
  locale: Locale;
}

const translations = {
  ka: {
    createdWith: 'შექმნილია',
    digitalMenu: 'Digital Menu',
    backToTop: 'დაბრუნება',
  },
  en: {
    createdWith: 'Created with',
    digitalMenu: 'Digital Menu',
    backToTop: 'Back to top',
  },
  ru: {
    createdWith: 'Создано с помощью',
    digitalMenu: 'Digital Menu',
    backToTop: 'Наверх',
  },
};

export function MenuFooter({ locale }: MenuFooterProps) {
  const t = translations[locale];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t bg-gradient-to-t from-muted/50 to-transparent">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="gap-2 rounded-full px-5 touch-feedback hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ArrowUp className="h-4 w-4" />
            {t.backToTop}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t.createdWith}{' '}
            <a
              href="/"
              className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
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
