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
}

export function LanguageSwitcher({
  currentLocale,
  variant = 'default',
  className,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (locale: Locale) => {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

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
        {locales.map((locale) => (
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
