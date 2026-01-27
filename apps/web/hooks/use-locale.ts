'use client';

import { useLocale as useNextIntlLocale } from 'next-intl';
import { type Locale } from '@/i18n/config';

/**
 * Hook to get the current locale
 * Wrapper around next-intl's useLocale with proper typing
 */
export function useLocale(): Locale {
  return useNextIntlLocale() as Locale;
}
