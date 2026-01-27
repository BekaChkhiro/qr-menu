'use server';

import { cookies } from 'next/headers';
import { isValidLocale, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/config';

export async function setLocale(locale: Locale): Promise<void> {
  if (!isValidLocale(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
  });
}
