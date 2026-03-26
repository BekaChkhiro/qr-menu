import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PhoneJourney } from './_components/phone-journey';

export const metadata: Metadata = {
  title: 'Digital Menu - QR Code Menu for Restaurants & Cafes',
  description:
    'Create and manage digital menus for cafes and restaurants with QR codes. Multi-language support, real-time updates, and analytics.',
  keywords: [
    'digital menu',
    'QR code menu',
    'restaurant menu',
    'cafe menu',
    'contactless menu',
    'Georgia',
  ],
  openGraph: {
    title: 'Digital Menu - QR Code Menu for Restaurants & Cafes',
    description:
      'Create and manage digital menus for cafes and restaurants with QR codes.',
    type: 'website',
    locale: 'en',
    alternateLocale: ['ka', 'ru'],
  },
};

export default async function LandingPage() {
  const t = await getTranslations('marketing');

  return (
    <PhoneJourney
      hero={{
        title: t('hero.title'),
        subtitle: t('hero.subtitle'),
        cta: t('hero.cta'),
        secondaryCta: t('hero.secondaryCta'),
        trustedBy: t('hero.trustedBy'),
      }}
      scenes={{
        create: {
          title: t('howItWorks.step1.title'),
          description: t('howItWorks.step1.description'),
          features: [
            t('features.qrCode.description'),
            t('features.realtime.description'),
            t('features.mobile.description'),
            t('features.branding.description'),
          ],
        },
        customize: {
          title: t('features.branding.title'),
          description: t('features.branding.description'),
          features: [
            t('features.multilingual.description'),
            t('features.branding.description'),
            t('features.mobile.description'),
            t('features.realtime.description'),
          ],
        },
        publish: {
          title: t('howItWorks.step2.title'),
          description: t('howItWorks.step2.description'),
          features: [
            t('features.qrCode.description'),
            t('howItWorks.step3.description'),
            t('features.realtime.description'),
            t('features.mobile.description'),
          ],
        },
        analytics: {
          title: t('features.analytics.title'),
          description: t('features.analytics.description'),
          features: [
            t('features.analytics.description'),
            t('features.realtime.description'),
            t('features.mobile.description'),
            t('features.multilingual.description'),
          ],
        },
      }}
      pricing={{
        title: t('pricing.title'),
        subtitle: t('pricing.subtitle'),
        currency: t('pricing.currency'),
        perMonth: t('pricing.perMonth'),
        plans: [
          {
            name: t('pricing.free.name'),
            price: t('pricing.free.price'),
            description: t('pricing.free.description'),
            features: t.raw('pricing.free.features') as string[],
            cta: t('pricing.free.cta'),
          },
          {
            name: t('pricing.starter.name'),
            price: t('pricing.starter.price'),
            description: t('pricing.starter.description'),
            popular: true,
            features: t.raw('pricing.starter.features') as string[],
            cta: t('pricing.starter.cta'),
          },
          {
            name: t('pricing.pro.name'),
            price: t('pricing.pro.price'),
            description: t('pricing.pro.description'),
            features: t.raw('pricing.pro.features') as string[],
            cta: t('pricing.pro.cta'),
          },
        ],
      }}
      cta={{
        title: t('cta.title'),
        subtitle: t('cta.subtitle'),
        button: t('cta.button'),
        noCard: t('cta.noCard'),
      }}
    />
  );
}
