'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  locales,
  localeNames,
  localeFlags,
  type Locale,
} from '@/i18n/config';
import { setLocale } from '@/lib/actions/locale';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  variant?: 'default' | 'compact';
  className?: string;
  /** Restrict available locales (e.g. from menu.enabledLanguages). If omitted, all supported locales are shown. */
  enabledLocales?: Locale[];
}

export function LanguageSwitcher({
  currentLocale,
  variant = 'default',
  className,
  enabledLocales,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

  const availableLocales =
    enabledLocales && enabledLocales.length > 0
      ? locales.filter((l) => enabledLocales.includes(l))
      : locales;

  // If only one locale is enabled, hide the switcher entirely
  if (availableLocales.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'sm' : 'default'}
          className={className}
          disabled={isPending}
        >
          <Globe className="h-4 w-4 mr-2" />
          {variant === 'default' && (
            <span>
              {localeFlags[currentLocale]} {localeNames[currentLocale]}
            </span>
          )}
          {variant === 'compact' && (
            <span>{localeFlags[currentLocale]}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={locale === currentLocale ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeFlags[locale]}</span>
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
