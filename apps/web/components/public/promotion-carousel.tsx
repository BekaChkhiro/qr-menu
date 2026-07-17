'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

interface Promotion {
  id: string;
  titleKa: string;
  titleEn: string | null;
  titleRu: string | null;
  descriptionKa?: string | null;
  descriptionEn?: string | null;
  descriptionRu?: string | null;
  imageUrl: string | null;
  // T22.19/T22.20 — type + appearance drive which visual variant renders.
  type?: 'PERCENTAGE' | 'BANNER' | 'COMBO' | null;
  backgroundColor?: string | null;
  showTitle?: boolean;
  // T22.21 — per-day windows (or legacy flat shape) for the detail view.
  timeRestrictions?: {
    enabled?: boolean;
    windows?: Record<string, { start: string; end: string }>;
    days?: string[];
    startTime?: string;
    endTime?: string;
  } | null;
}

interface PromotionCarouselProps {
  promotions: Promotion[];
  locale: Locale;
}

const AUTO_ADVANCE_MS = 4500;
const INTERACT_PAUSE_MS = 8000;

const DAY_LABELS: Record<string, Record<Locale, string>> = {
  mon: { ka: 'ორშ', en: 'Mon', ru: 'Пн' },
  tue: { ka: 'სამ', en: 'Tue', ru: 'Вт' },
  wed: { ka: 'ოთხ', en: 'Wed', ru: 'Ср' },
  thu: { ka: 'ხუთ', en: 'Thu', ru: 'Чт' },
  fri: { ka: 'პარ', en: 'Fri', ru: 'Пт' },
  sat: { ka: 'შაბ', en: 'Sat', ru: 'Сб' },
  sun: { ka: 'კვ', en: 'Sun', ru: 'Вс' },
};
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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

function getDescription(p: Promotion, locale: Locale): string | null {
  switch (locale) {
    case 'en':
      return p.descriptionEn || p.descriptionKa || null;
    case 'ru':
      return p.descriptionRu || p.descriptionKa || null;
    default:
      return p.descriptionKa || null;
  }
}

// Flatten per-day windows (or a legacy flat window) into printable rows.
function timeRows(p: Promotion, locale: Locale): string[] {
  const tr = p.timeRestrictions;
  if (!tr?.enabled) return [];
  const windows: Record<string, { start: string; end: string }> =
    tr.windows && Object.keys(tr.windows).length > 0
      ? tr.windows
      : tr.days?.length
        ? Object.fromEntries(
            tr.days.map((d) => [d, { start: tr.startTime ?? '09:00', end: tr.endTime ?? '18:00' }]),
          )
        : {};
  return DAY_ORDER.filter((d) => windows[d]).map(
    (d) => `${DAY_LABELS[d][locale]} ${windows[d].start}–${windows[d].end}`,
  );
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
  const [expanded, setExpanded] = useState<Promotion | null>(null);
  const activeIndexRef = useRef(0);
  const lastInteractRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const noteInteract = () => {
    lastInteractRef.current = Date.now();
  };

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

  const handlePrev = () => {
    noteInteract();
    scrollToIndex(Math.max(0, activeIndex - 1));
  };
  const handleNext = () => {
    noteInteract();
    scrollToIndex(Math.min(slides.length - 1, activeIndex + 1));
  };

  // T22.22 — auto-advance on a timer; pauses while a detail sheet is open or
  // shortly after any manual interaction (scroll / tap / arrow).
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      if (expanded) return;
      if (Date.now() - lastInteractRef.current < INTERACT_PAUSE_MS) return;
      const track = trackRef.current;
      if (!track) return;
      const next = (activeIndexRef.current + 1) % slides.length;
      const slide = track.querySelectorAll<HTMLElement>('[data-promo-slide]')[next];
      slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [slides.length, expanded]);

  // Close the detail sheet on Escape.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  if (slides.length === 0) return null;

  return (
    <section className="px-4 py-4" aria-label={locale === 'ka' ? 'აქციები' : 'Promotions'}>
      <div className="relative mx-auto max-w-2xl">
        <div
          ref={trackRef}
          onPointerDown={noteInteract}
          onWheel={noteInteract}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[15%]"
          role="list"
        >
          {slides.map((promo, i) => {
            const title = getTitle(promo, locale);
            const showTitle = promo.showTitle ?? true;
            return (
              <button
                key={promo.id}
                type="button"
                data-promo-slide
                data-testid={`promotion-slide-${promo.id}`}
                onClick={() => setExpanded(promo)}
                className="relative aspect-[16/9] w-[70%] shrink-0 cursor-pointer snap-center overflow-hidden rounded-[var(--menu-radius-card)] text-left shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--menu-primary)]"
                style={
                  promo.imageUrl
                    ? undefined
                    : {
                        background:
                          promo.backgroundColor ||
                          'linear-gradient(135deg, #7A8C5F, #4F5F3F)',
                      }
                }
                aria-label={title}
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

                {/* T22.22 — "see full" expand affordance */}
                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">
                  {locale === 'ka' ? 'სრულად ›' : locale === 'ru' ? 'Подробнее ›' : 'Details ›'}
                </span>
              </button>
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
                  onClick={() => {
                    noteInteract();
                    scrollToIndex(i);
                  }}
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

      {/* T22.22 — detail sheet: title, description, and the promotion's
          days / restricted hours. */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          data-testid="promotion-detail-sheet"
          onClick={() => setExpanded(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-t-2xl bg-background sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {expanded.imageUrl && (
              <div className="relative aspect-[16/9] w-full bg-muted">
                <Image
                  src={expanded.imageUrl}
                  alt={getTitle(expanded, locale)}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 448px, 100vw"
                  unoptimized={expanded.imageUrl.toLowerCase().endsWith('.gif')}
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[17px] font-semibold leading-snug text-foreground">
                  {getTitle(expanded, locale)}
                </h3>
                <button
                  type="button"
                  onClick={() => setExpanded(null)}
                  aria-label="Close"
                  data-testid="promotion-detail-close"
                  className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {getDescription(expanded, locale) && (
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {getDescription(expanded, locale)}
                </p>
              )}

              {timeRows(expanded, locale).length > 0 && (
                <div className="mt-4 space-y-1.5" data-testid="promotion-detail-hours">
                  {timeRows(expanded, locale).map((row) => (
                    <div key={row} className="flex items-center gap-2 text-[13px] text-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.6} />
                      <span className="font-mono tabular-nums">{row}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
