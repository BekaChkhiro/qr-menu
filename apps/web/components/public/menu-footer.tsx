'use client';

import { ArrowUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';
import { AllergenLegend } from './allergen-legend';
import {
  groupWorkingHours,
  hasWorkingHours,
  type WeekdayKey,
  type WorkingHoursDay,
} from '@/lib/menu/working-hours';

interface MenuFooterProps {
  locale: Locale;
  currencySymbol?: string;
  allergenMode?: 'TEXT' | 'ICON' | 'WARNING';
  hasAllergens?: boolean;
  /** T24.4 — venue opening hours; omitted/empty renders nothing. */
  workingHours?: WorkingHoursDay[] | null;
}

const translations = {
  ka: {
    createdWith: 'შექმნილია',
    digitalMenu: 'Digital Menu',
    backToTop: 'დაბრუნება',
    pricesIn: 'ფასები',
    currency: 'ლარში',
    workingHours: 'სამუშაო საათები',
    closed: 'დაკეტილია',
    breakLabel: 'შესვენება',
    days: { mon: 'ორშ', tue: 'სამ', wed: 'ოთხ', thu: 'ხუთ', fri: 'პარ', sat: 'შაბ', sun: 'კვი' },
  },
  en: {
    createdWith: 'Created with',
    digitalMenu: 'Digital Menu',
    backToTop: 'Back to top',
    pricesIn: 'Prices in',
    currency: '',
    workingHours: 'Opening hours',
    closed: 'Closed',
    breakLabel: 'break',
    days: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' },
  },
  ru: {
    createdWith: 'Создано с помощью',
    digitalMenu: 'Digital Menu',
    backToTop: 'Наверх',
    pricesIn: 'Цены в',
    currency: '',
    workingHours: 'Часы работы',
    closed: 'Закрыто',
    breakLabel: 'перерыв',
    days: { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' },
  },
};

/** "Mon" for a single day, "Mon–Fri" for a run. */
function formatDayRange(days: WeekdayKey[], labels: Record<string, string>): string {
  if (days.length === 1) return labels[days[0]];
  return `${labels[days[0]]}–${labels[days[days.length - 1]]}`;
}

export function MenuFooter({
  locale,
  currencySymbol = '₾',
  allergenMode,
  hasAllergens = false,
  workingHours,
}: MenuFooterProps) {
  const t = translations[locale];
  const hourGroups = hasWorkingHours(workingHours) ? groupWorkingHours(workingHours) : [];

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
            className="gap-2 rounded-full px-5 touch-feedback transition-colors hover:bg-[var(--menu-primary)] hover:text-white"
          >
            <ArrowUp className="h-4 w-4" />
            {t.backToTop}
          </Button>

          {/* T24.4 — venue opening hours */}
          {hourGroups.length > 0 && (
            <div
              className="w-full rounded-[var(--menu-radius-card)] border bg-card/60 px-4 py-3"
              data-testid="menu-footer-working-hours"
            >
              <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                {t.workingHours}
              </div>
              <dl className="mx-auto flex max-w-xs flex-col gap-1 text-xs">
                {hourGroups.map((g) => (
                  <div key={g.days.join('-')} className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{formatDayRange(g.days, t.days)}</dt>
                    <dd className="text-right tabular-nums">
                      {g.closed ? (
                        <span className="text-muted-foreground">{t.closed}</span>
                      ) : (
                        <>
                          {g.open}–{g.close}
                          {g.breakStart && g.breakEnd && (
                            <span className="ml-1.5 text-muted-foreground">
                              ({t.breakLabel} {g.breakStart}–{g.breakEnd})
                            </span>
                          )}
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

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
              className="font-medium text-[var(--menu-accent)] underline-offset-4 transition-colors hover:underline"
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
