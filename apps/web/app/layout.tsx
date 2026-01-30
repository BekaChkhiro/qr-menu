import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { QueryProvider } from '@/lib/query/query-provider';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { Toaster } from '@/components/ui/sonner';
import { SkipLink, AnnouncerProvider } from '@/components/accessibility';
import { getLocaleFromCookie, LOCALE_COOKIE_NAME, defaultLocale } from '@/i18n/config';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'] });

export const metadata: Metadata = {
  title: 'Digital Menu - QR Code Menu Management',
  description: 'Create and manage digital menus for cafes and restaurants with QR codes',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = getLocaleFromCookie(localeCookie);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AnnouncerProvider>
            <SkipLink />
            <QueryProvider>{children}</QueryProvider>
            <Toaster />
          </AnnouncerProvider>
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
