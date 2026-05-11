'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, Globe } from 'lucide-react';
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
import { setLocale, setUserLocale } from '@/lib/actions/locale';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  variant?: 'default' | 'compact';
  className?: string;
  triggerTestId?: string;
  /** Restrict available locales (e.g. from menu.enabledLanguages). If omitted, all supported locales are shown. */
  enabledLocales?: Locale[];
  /**
   * When true, an authenticated user's choice is persisted to `User.locale`
   * (admin/marketing contexts). When false (default), the change is cookie-only
   * — used by visitor surfaces like the public menu so that previewing in
   * another language does not overwrite the operator's stored preference.
   */
  persistToProfile?: boolean;
}

export function LanguageSwitcher({
  currentLocale,
  variant = 'default',
  className,
  triggerTestId,
  enabledLocales,
  persistToProfile = false,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const t = useTranslations('common.language');
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      if (persistToProfile) {
        await setUserLocale(locale);
      } else {
        await setLocale(locale);
      }
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

  const currentCode = currentLocale.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'compact' ? 'secondary' : 'ghost'}
          size={variant === 'compact' ? 'sm' : 'md'}
          className={cn(
            variant === 'compact'
              ? 'border-border bg-card px-2 text-[12px] font-semibold text-text-default shadow-none hover:bg-chip'
              : 'text-text-default',
            className,
          )}
          disabled={isPending}
          aria-label={t('select')}
          data-testid={triggerTestId}
        >
          <Globe
            size={variant === 'compact' ? 14 : 15}
            strokeWidth={1.5}
            className="text-text-muted"
            aria-hidden="true"
          />
          {variant === 'default' && (
            <span className="text-[12.5px]">
              <span aria-hidden="true">{localeFlags[currentLocale]}</span>{' '}
              {localeNames[currentLocale]}
            </span>
          )}
          {variant === 'compact' && (
            <span className="tabular-nums">{currentCode}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[168px] rounded-card border-border bg-card p-1 shadow-md"
      >
        {availableLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            aria-current={locale === currentLocale ? 'true' : undefined}
            data-testid={`language-switcher-item-${locale}`}
            className={cn(
              'cursor-pointer gap-2 rounded-md px-2 py-[7px] text-[13px] text-text-default focus:bg-chip focus:text-text-default',
              locale === currentLocale &&
                'bg-accent-soft font-semibold text-accent focus:bg-accent-soft focus:text-accent',
            )}
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-chip text-[12px]"
            >
              {localeFlags[locale]}
            </span>
            <span className="flex-1">{localeNames[locale]}</span>
            <span className="text-[10.5px] font-bold uppercase text-text-subtle">
              {locale}
            </span>
            {locale === currentLocale && (
              <Check
                size={14}
                strokeWidth={1.5}
                className="text-accent"
                aria-hidden="true"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
