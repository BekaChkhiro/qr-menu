'use server';

import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { isValidLocale, LOCALE_COOKIE_NAME, type Locale } from '@/i18n/config';
import type { Language } from '@prisma/client';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

async function writeLocaleCookie(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });
}

function assertValidLocale(locale: Locale): Locale {
  if (!isValidLocale(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }
  return locale;
}

/**
 * Visitor-scoped locale switch — writes the NEXT_LOCALE cookie only.
 * Use from contexts where the choice should NOT persist to the authenticated
 * user's profile (e.g. the public menu language switcher).
 */
export async function setLocale(locale: Locale): Promise<void> {
  assertValidLocale(locale);
  await writeLocaleCookie(locale);
}

/**
 * Authenticated locale switch — writes the cookie and, if a session exists,
 * persists the preference to `User.locale` so it survives visitor-driven
 * cookie changes (e.g. the user previewing a public menu in another language).
 *
 * No-op against the database when called without a session — falls back to
 * cookie-only behavior so the action remains safe in shared components.
 */
export async function setUserLocale(locale: Locale): Promise<void> {
  assertValidLocale(locale);
  await writeLocaleCookie(locale);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const dbLocale = locale.toUpperCase() as Language;
  await prisma.user.update({
    where: { id: userId },
    data: { locale: dbLocale },
  });
}
