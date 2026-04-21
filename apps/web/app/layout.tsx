import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { QueryProvider } from '@/lib/query/query-provider';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { WebVitals } from '@/components/analytics/web-vitals';
import { Toaster } from '@/components/ui/sonner';
import { SkipLink, AnnouncerProvider } from '@/components/accessibility';
import { getLocaleFromCookie, LOCALE_COOKIE_NAME } from '@/i18n/config';
import './globals.css';

// Note: Inter supports discrete weights 100-900 in steps of 100 via Google Fonts.
// Section H spec requests 450 and 550 which are not available as discrete weights
// (they would require the variable font axis). Using 400, 500, 600, 700 instead.
const inter = Inter({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Digital Menu - QR Code Menu Management',
  description: 'Create and manage digital menus for cafes and restaurants with QR codes',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Critical: do NOT set maximumScale / userScalable=no — breaks pinch-zoom a11y (WCAG 1.4.4)
  viewportFit: 'cover', // extend under iOS notch; pair with env(safe-area-inset-*) in CSS
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
    <html lang={locale} className={inter.variable}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AnnouncerProvider>
            <SkipLink />
            <QueryProvider>{children}</QueryProvider>
            <Toaster />
          </AnnouncerProvider>
        </NextIntlClientProvider>
        <GoogleAnalytics />
        <WebVitals />
      </body>
    </html>
  );
}
