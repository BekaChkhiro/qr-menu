import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, getLocaleFromCookie, LOCALE_COOKIE_NAME, type Locale } from './config';

// Import all locale messages statically
import kaCommon from '@/messages/ka/common.json';
import enCommon from '@/messages/en/common.json';
import ruCommon from '@/messages/ru/common.json';
import kaAuth from '@/messages/ka/auth.json';
import enAuth from '@/messages/en/auth.json';
import ruAuth from '@/messages/ru/auth.json';
import kaAdmin from '@/messages/ka/admin.json';
import enAdmin from '@/messages/en/admin.json';
import ruAdmin from '@/messages/ru/admin.json';
import kaMenu from '@/messages/ka/menu.json';
import enMenu from '@/messages/en/menu.json';
import ruMenu from '@/messages/ru/menu.json';

// Merge all message namespaces
const messages = {
  ka: { ...kaCommon, auth: kaAuth, admin: kaAdmin, menu: kaMenu },
  en: { ...enCommon, auth: enAuth, admin: enAdmin, menu: enMenu },
  ru: { ...ruCommon, auth: ruAuth, admin: ruAdmin, menu: ruMenu },
} as const;

export type Messages = (typeof messages)['ka'];

export default getRequestConfig(async () => {
  // Get locale from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = getLocaleFromCookie(localeCookie);

  return {
    locale,
    messages: messages[locale],
  };
});

// Helper to get current locale on server
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return getLocaleFromCookie(localeCookie);
}
