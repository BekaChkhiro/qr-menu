'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

interface Promotion {
  id: string;
  titleKa: string;
  titleEn: string | null;
  titleRu: string | null;
  imageUrl: string | null;
  // T22.19/T22.20 — type + appearance drive which visual variant renders.
  type?: 'PERCENTAGE' | 'BANNER' | 'COMBO' | null;
  backgroundColor?: string | null;
  showTitle?: boolean;
}

interface PromotionCarouselProps {
  promotions: Promotion[];
  locale: Locale;
}

function getTitle(p: Promotion, locale: Locale): string {
  switch (locale) {
    case 'en':
      return p.titleEn || p.titleKa;
    case 'ru':
      return p.titleRu || p.titleKa;
    default:
      return p.titleKa;
  }
}

// A promotion shows in the carousel when it has a banner image, OR it is a
// title-only BANNER announcement (T22.20 — "café without a designer"). Pure
// percentage/combo promotions with no image surface via prices / the Offers
// category instead, so they are not carded here.
function isCarded(p: Promotion): boolean {
  return Boolean(p.imageUrl) || p.type === 'BANNER';
}

export function PromotionCarousel({ promotions, locale }: PromotionCarouselProps) {
  const slides = promotions.filter(isCarded);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track which slide is currently centered by watching scroll position
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      const els = track.querySelectorAll<HTMLElement>('[data-promo-slide]');
      let closestIndex = 0;
      let closestDistance = Infinity;
      els.forEach((slide, i) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distance = Math.abs(slideCenter - centerX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });
      setActiveIndex(closestIndex);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, [slides.length]);

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelectorAll<HTMLElement>('[data-promo-slide]')[idx];
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handlePrev = () => scrollToIndex(Math.max(0, activeIndex - 1));
  const handleNext = () => scrollToIndex(Math.min(slides.length - 1, activeIndex + 1));

  if (slides.length === 0) return null;

  return (
    <section className="px-4 py-4" aria-label={locale === 'ka' ? 'აქციები' : 'Promotions'}>
      <div className="relative mx-auto max-w-2xl">
        <div
          ref={trackRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[15%]"
          role="list"
        >
          {slides.map((promo, i) => {
            const title = getTitle(promo, locale);
            const showTitle = promo.showTitle ?? true;
            return (
              <div
                key={promo.id}
                data-promo-slide
                data-testid={`promotion-slide-${promo.id}`}
                className="relative aspect-[16/9] w-[70%] shrink-0 snap-center overflow-hidden rounded-[var(--menu-radius-card)] shadow-sm"
                style={
                  promo.imageUrl
                    ? undefined
                    : {
                        background:
                          promo.backgroundColor ||
                          'linear-gradient(135deg, #7A8C5F, #4F5F3F)',
                      }
                }
                role="listitem"
              >
                {promo.imageUrl ? (
                  <>
                    {/* Variant 1/2 — banner, with optional title overlay */}
                    <Image
                      src={promo.imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 448px, 70vw"
                      priority={i === 0}
                      unoptimized={promo.imageUrl.toLowerCase().endsWith('.gif')}
                    />
                    {showTitle && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <span
                          className="text-[14px] font-semibold text-white drop-shadow"
                          data-testid="promotion-slide-title"
                        >
                          {title}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  /* Variant 3 — title-only card on the chosen background color */
                  <div className="flex h-full items-center justify-center px-4 text-center">
                    <span
                      className="text-[16px] font-semibold leading-snug text-white drop-shadow"
                      data-testid="promotion-slide-title"
                    >
                      {title}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Prev/Next — visible only if more than one */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className={cn(
                'absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow backdrop-blur transition-opacity hover:bg-background disabled:opacity-0',
              )}
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeIndex === slides.length - 1}
              className={cn(
                'absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow backdrop-blur transition-opacity hover:bg-background disabled:opacity-0',
              )}
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="mt-2 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIndex ? 'w-5 bg-[var(--menu-primary)]' : 'w-1.5 bg-muted-foreground/40',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
