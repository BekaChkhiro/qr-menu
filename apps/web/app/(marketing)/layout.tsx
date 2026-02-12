import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Header, Footer } from '@/components/marketing';
import { getLocaleFromCookie, LOCALE_COOKIE_NAME } from '@/i18n/config';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get locale
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = getLocaleFromCookie(localeCookie);

  // Get translations
  const t = await getTranslations('marketing');

  const headerTranslations = {
    features: t('header.features'),
    pricing: t('header.pricing'),
    demo: t('header.demo'),
    login: t('header.login'),
    getStarted: t('header.getStarted'),
  };

  const footerTranslations = {
    product: t('footer.product'),
    features: t('footer.features'),
    pricing: t('footer.pricing'),
    demo: t('footer.demo'),
    company: t('footer.company'),
    about: t('footer.about'),
    contact: t('footer.contact'),
    blog: t('footer.blog'),
    legal: t('footer.legal'),
    privacy: t('footer.privacy'),
    terms: t('footer.terms'),
    cookies: t('footer.cookies'),
    followUs: t('footer.followUs'),
    copyright: t('footer.copyright', { year: new Date().getFullYear().toString() }),
    tagline: t('footer.tagline'),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} translations={headerTranslations} />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer translations={footerTranslations} />
    </div>
  );
}
