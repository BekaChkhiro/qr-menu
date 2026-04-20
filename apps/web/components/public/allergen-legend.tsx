'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Locale } from '@/i18n/config';
import { allergenLabels, allergenShort } from './product-card-shared';

interface AllergenLegendProps {
  locale: Locale;
  mode: 'TEXT' | 'ICON' | 'WARNING';
  className?: string;
}

const titles = {
  ka: 'ალერგენების ცხრილი',
  en: 'Allergen key',
  ru: 'Аллергены',
};

const subtitles = {
  ka: 'EU-ს რეგულაცია 1169/2011 — 14 ალერგენი',
  en: 'EU Regulation 1169/2011 — 14 regulated allergens',
  ru: 'Регламент ЕС 1169/2011 — 14 аллергенов',
};

const triggerLabels = {
  ka: 'ალერგენების ცხრილი',
  en: 'Allergen key',
  ru: 'Аллергены',
};

const ALLERGENS_ORDER = [
  'GLUTEN',
  'DAIRY',
  'EGGS',
  'FISH',
  'SHELLFISH',
  'SEAFOOD',
  'NUTS',
  'PEANUTS',
  'SOY',
  'SESAME',
  'MUSTARD',
  'CELERY',
  'LUPIN',
  'SULPHITES',
  'PORK',
];

export function AllergenLegend({ locale, mode, className }: AllergenLegendProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            className
          )}
        >
          <Info className="h-3.5 w-3.5" />
          {triggerLabels[locale]}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[locale]}</DialogTitle>
          <p className="text-xs text-muted-foreground">{subtitles[locale]}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {ALLERGENS_ORDER.map((a) => {
            const short = allergenShort[a];
            const label = allergenLabels[a]?.[locale] || a;
            return (
              <div
                key={a}
                className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <span
                  className={cn(
                    'inline-flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold',
                    mode === 'WARNING'
                      ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                      : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                  )}
                >
                  {short}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {locale === 'ka' &&
            'ალერგიის შემთხვევაში გთხოვთ, მიმართოთ ადგილზე მომსახურე პერსონალს დეტალური ინფორმაციისთვის.'}
          {locale === 'en' &&
            'If you have any food allergies, please inform the staff for detailed information.'}
          {locale === 'ru' &&
            'При наличии аллергии обратитесь к персоналу для подробной информации.'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
