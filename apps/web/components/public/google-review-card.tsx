import { Star } from 'lucide-react';
import type { Locale } from '@/i18n/config';

interface GoogleReviewCardProps {
  url: string | null | undefined;
  locale: Locale;
}

const COPY: Record<Locale, { title: string; subtitle: string; cta: string }> = {
  ka: {
    title: 'შეგვაფასეთ Google-ზე',
    subtitle: 'თქვენი შეფასება ჩვენთვის მნიშვნელოვანია',
    cta: 'შეფასების დატოვება',
  },
  en: {
    title: 'Rate us on Google',
    subtitle: 'Your feedback means a lot to us',
    cta: 'Leave a review',
  },
  ru: {
    title: 'Оцените нас в Google',
    subtitle: 'Ваш отзыв очень важен для нас',
    cta: 'Оставить отзыв',
  },
};

export function GoogleReviewCard({ url, locale }: GoogleReviewCardProps) {
  const href = url?.trim();
  if (!href) return null;

  const copy = COPY[locale] ?? COPY.ka;

  return (
    <section className="mx-auto max-w-2xl px-4 pb-6">
      <div
        data-testid="google-review-card"
        className="flex flex-col gap-3 rounded-[var(--menu-radius-card)] border bg-card px-4 py-4 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-start gap-3">
          <Star
            strokeWidth={1.5}
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--menu-accent)]"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{copy.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{copy.subtitle}</p>
          </div>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="google-review-link"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--menu-primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {copy.cta}
        </a>
      </div>
    </section>
  );
}
