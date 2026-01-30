'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tag, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

interface Promotion {
  id: string;
  titleKa: string;
  titleEn: string | null;
  titleRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  imageUrl: string | null;
  startDate: string | Date;
  endDate: string | Date;
}

interface PromotionBannerProps {
  promotion: Promotion;
  locale: Locale;
}

function getPromotionTitle(promotion: Promotion, locale: Locale): string {
  switch (locale) {
    case 'en':
      return promotion.titleEn || promotion.titleKa;
    case 'ru':
      return promotion.titleRu || promotion.titleKa;
    default:
      return promotion.titleKa;
  }
}

function getPromotionDescription(promotion: Promotion, locale: Locale): string | null {
  switch (locale) {
    case 'en':
      return promotion.descriptionEn || promotion.descriptionKa;
    case 'ru':
      return promotion.descriptionRu || promotion.descriptionKa;
    default:
      return promotion.descriptionKa;
  }
}

function getDaysRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function getEndsInText(daysRemaining: number, locale: Locale): string {
  if (daysRemaining === 0) {
    return locale === 'ka' ? 'დღეს მთავრდება' : locale === 'ru' ? 'Заканчивается сегодня' : 'Ends today';
  }
  if (daysRemaining === 1) {
    return locale === 'ka' ? 'ხვალ მთავრდება' : locale === 'ru' ? 'Заканчивается завтра' : 'Ends tomorrow';
  }
  return locale === 'ka'
    ? `${daysRemaining} დღეში მთავრდება`
    : locale === 'ru'
    ? `Заканчивается через ${daysRemaining} дн.`
    : `Ends in ${daysRemaining} days`;
}

export function PromotionBanner({ promotion, locale }: PromotionBannerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const title = getPromotionTitle(promotion, locale);
  const description = getPromotionDescription(promotion, locale);
  const daysRemaining = getDaysRemaining(promotion.endDate);
  const endsInText = getEndsInText(daysRemaining, locale);
  const isUrgent = daysRemaining <= 1;

  return (
    <Card
      className={cn(
        'overflow-hidden border-primary/30 animate-slide-in-left',
        'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent',
        isUrgent && 'border-orange-400/50 from-orange-500/15 via-orange-500/5'
      )}
    >
      <CardContent className="p-0">
        <div className="flex gap-4">
          {promotion.imageUrl && !imageError && (
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 bg-muted">
              {!imageLoaded && (
                <Skeleton className="absolute inset-0" />
              )}
              <Image
                src={promotion.imageUrl}
                alt={title}
                fill
                className={cn(
                  'object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                sizes="(min-width: 640px) 112px, 96px"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          )}
          <div className={cn(
            'flex-1 py-3 pr-4',
            !promotion.imageUrl && 'pl-4'
          )}>
            <div className="flex items-start gap-2">
              <Tag className={cn(
                'h-4 w-4 flex-shrink-0 mt-0.5',
                isUrgent ? 'text-orange-500' : 'text-primary'
              )} />
              <div className="min-w-0 flex-1">
                <h3 className={cn(
                  'font-semibold leading-tight',
                  isUrgent ? 'text-orange-600 dark:text-orange-400' : 'text-primary'
                )}>
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )}
                <div className={cn(
                  'flex items-center gap-1.5 mt-2 text-xs font-medium',
                  isUrgent
                    ? 'text-orange-600 dark:text-orange-400 animate-pulse-urgent'
                    : 'text-muted-foreground'
                )}>
                  <Clock className="h-3 w-3" />
                  <span>{endsInText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
