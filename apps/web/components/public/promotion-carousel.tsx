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

export function PromotionCarousel({ promotions, locale }: PromotionCarouselProps) {
  const withImages = promotions.filter((p) => p.imageUrl);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track which slide is currently centered by watching scroll position
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      const slides = track.querySelectorAll<HTMLElement>('[data-promo-slide]');
      let closestIndex = 0;
      let closestDistance = Infinity;
      slides.forEach((slide, i) => {
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
  }, [withImages.length]);

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelectorAll<HTMLElement>('[data-promo-slide]')[idx];
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handlePrev = () => scrollToIndex(Math.max(0, activeIndex - 1));
  const handleNext = () =>
    scrollToIndex(Math.min(withImages.length - 1, activeIndex + 1));

  if (withImages.length === 0) return null;

  return (
    <section className="px-4 py-4" aria-label={locale === 'ka' ? 'აქციები' : 'Promotions'}>
      <div className="relative mx-auto max-w-2xl">
        <div
          ref={trackRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[15%]"
          role="list"
        >
          {withImages.map((promo) => (
            <div
              key={promo.id}
              data-promo-slide
              className="relative aspect-[16/9] w-[70%] shrink-0 snap-center overflow-hidden rounded-2xl bg-muted shadow-sm"
              role="listitem"
            >
              {promo.imageUrl && (
                <Image
                  src={promo.imageUrl}
                  alt={getTitle(promo, locale)}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 448px, 70vw"
                  priority={withImages.indexOf(promo) === 0}
                />
              )}
            </div>
          ))}
        </div>

        {/* Prev/Next — visible only if more than one */}
        {withImages.length > 1 && (
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
              disabled={activeIndex === withImages.length - 1}
              className={cn(
                'absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow backdrop-blur transition-opacity hover:bg-background disabled:opacity-0',
              )}
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="mt-2 flex justify-center gap-1.5">
              {withImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/40'
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
