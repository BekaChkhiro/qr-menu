import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HeroSection } from './_components/hero-section';
import { FeaturesSection } from './_components/features-section';
import { HowItWorksSection } from './_components/how-it-works-section';
import { PricingSection } from './_components/pricing-section';
import { CtaSection } from './_components/cta-section';

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
    <>
      <HeroSection
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        cta={t('hero.cta')}
        secondaryCta={t('hero.secondaryCta')}
        trustedBy={t('hero.trustedBy')}
      />
      <FeaturesSection
        title={t('features.title')}
        subtitle={t('features.subtitle')}
        features={{
          qrCode: {
            title: t('features.qrCode.title'),
            description: t('features.qrCode.description'),
          },
          multilingual: {
            title: t('features.multilingual.title'),
            description: t('features.multilingual.description'),
          },
          realtime: {
            title: t('features.realtime.title'),
            description: t('features.realtime.description'),
          },
          analytics: {
            title: t('features.analytics.title'),
            description: t('features.analytics.description'),
          },
          mobile: {
            title: t('features.mobile.title'),
            description: t('features.mobile.description'),
          },
          branding: {
            title: t('features.branding.title'),
            description: t('features.branding.description'),
          },
        }}
      />
      <HowItWorksSection
        title={t('howItWorks.title')}
        subtitle={t('howItWorks.subtitle')}
        steps={{
          step1: {
            title: t('howItWorks.step1.title'),
            description: t('howItWorks.step1.description'),
          },
          step2: {
            title: t('howItWorks.step2.title'),
            description: t('howItWorks.step2.description'),
          },
          step3: {
            title: t('howItWorks.step3.title'),
            description: t('howItWorks.step3.description'),
          },
        }}
      />
      <PricingSection
        title={t('pricing.title')}
        subtitle={t('pricing.subtitle')}
        currency={t('pricing.currency')}
        perMonth={t('pricing.perMonth')}
        plans={{
          free: {
            name: t('pricing.free.name'),
            price: t('pricing.free.price'),
            description: t('pricing.free.description'),
            features: t.raw('pricing.free.features') as string[],
            cta: t('pricing.free.cta'),
          },
          starter: {
            name: t('pricing.starter.name'),
            price: t('pricing.starter.price'),
            description: t('pricing.starter.description'),
            popular: true,
            features: t.raw('pricing.starter.features') as string[],
            cta: t('pricing.starter.cta'),
          },
          pro: {
            name: t('pricing.pro.name'),
            price: t('pricing.pro.price'),
            description: t('pricing.pro.description'),
            features: t.raw('pricing.pro.features') as string[],
            cta: t('pricing.pro.cta'),
          },
        }}
      />
      <CtaSection
        title={t('cta.title')}
        subtitle={t('cta.subtitle')}
        button={t('cta.button')}
        noCard={t('cta.noCard')}
      />
    </>
  );
}
