import Link from 'next/link';
import { ActivityType } from '@prisma/client';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  QrCode,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { prisma } from '@/lib/db';

const DEFAULT_LIMIT = 6;

type Tone = 'success' | 'neutral' | 'accent';

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  neutral: 'bg-chip text-text-muted',
  accent: 'bg-accent-soft text-accent',
};

const TYPE_META: Record<ActivityType, { icon: LucideIcon; tone: Tone }> = {
  MENU_CREATED: { icon: Plus, tone: 'success' },
  MENU_PUBLISHED: { icon: CheckCircle2, tone: 'success' },
  CATEGORY_CREATED: { icon: Tag, tone: 'neutral' },
  PRODUCT_CREATED: { icon: Plus, tone: 'success' },
  PRICE_CHANGED: { icon: Pencil, tone: 'neutral' },
  PROMOTION_STARTED: { icon: Sparkles, tone: 'accent' },
  PROMOTION_ENDED: { icon: Clock, tone: 'neutral' },
  QR_SCANNED: { icon: QrCode, tone: 'accent' },
};

const TYPE_TO_EVENT_KEY: Record<ActivityType, string> = {
  MENU_CREATED: 'menuCreated',
  MENU_PUBLISHED: 'menuPublished',
  CATEGORY_CREATED: 'categoryCreated',
  PRODUCT_CREATED: 'productCreated',
  PRICE_CHANGED: 'priceChanged',
  PROMOTION_STARTED: 'promotionStarted',
  PROMOTION_ENDED: 'promotionEnded',
  QR_SCANNED: 'qrScanned',
};

interface ActivityFeedProps {
  userId: string;
  limit?: number;
  /** Clock override for deterministic relative timestamps in tests. */
  now?: Date;
}

function formatRelative(
  createdAt: Date,
  now: Date,
  t: Awaited<ReturnType<typeof getTranslations>>
): string {
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return t('meta.justNow');
  if (diffMin < 60) return t('meta.minutesAgo', { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('meta.hoursAgo', { count: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  return t('meta.daysAgo', { count: diffDay });
}

export async function ActivityFeed({
  userId,
  limit = DEFAULT_LIMIT,
  now,
}: ActivityFeedProps) {
  const t = await getTranslations('admin.dashboard.activity');

  const events = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      menu: {
        select: { id: true, name: true },
      },
    },
  });

  const clock = now ?? new Date();

  return (
    <section
      data-testid="dashboard-activity-feed"
      className="rounded-card border border-border bg-card px-5 py-[18px]"
    >
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[14.5px] font-semibold tracking-[-0.2px] text-text-default">
          {t('title')}
        </h2>
        <Link
          href="/admin/dashboard"
          aria-disabled="true"
          tabIndex={-1}
          data-testid="dashboard-activity-view-all"
          className="pointer-events-none inline-flex items-center gap-[3px] text-xs text-text-muted"
        >
          {t('viewAll')}
          <ArrowRight strokeWidth={1.8} className="h-[11px] w-[11px]" />
        </Link>
      </div>

      {events.length === 0 ? (
        <p
          data-testid="dashboard-activity-empty"
          className="py-4 text-[12.8px] leading-relaxed text-text-muted"
        >
          {t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {events.map((event, idx) => {
            const { icon: Icon, tone } = TYPE_META[event.type];
            const eventKey = TYPE_TO_EVENT_KEY[event.type];
            const payload = (event.payload ?? {}) as Record<string, unknown>;
            const menuName =
              (payload.menuName as string | undefined) ?? event.menu?.name ?? '';
            const productName = (payload.productName as string | undefined) ?? '';
            const categoryName = (payload.categoryName as string | undefined) ?? '';
            const promotionName = (payload.promotionName as string | undefined) ?? '';

            // Use productCreatedNoCategory fallback when we only have a product name
            const messageKey =
              event.type === 'PRODUCT_CREATED' && !categoryName
                ? 'productCreatedNoCategory'
                : `events.${eventKey}`;

            const values: Record<string, string | number> = {
              menuName,
              productName,
              categoryName,
              promotionName,
            };

            if (event.type === 'PRICE_CHANGED') {
              const oldPrice = Number(payload.oldPrice ?? 0);
              const newPrice = Number(payload.newPrice ?? 0);
              values.oldPrice = `${oldPrice}₾`;
              values.newPrice = `${newPrice}₾`;
            }

            const meta = formatRelative(event.createdAt, clock, t);
            const isLast = idx === events.length - 1;

            return (
              <li
                key={event.id}
                data-testid="dashboard-activity-row"
                data-activity-type={event.type}
                className={[
                  'flex items-start gap-2.5 py-2',
                  isLast ? '' : 'border-b border-border-soft',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'mt-px flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[6px]',
                    TONE_CLASSES[tone],
                  ].join(' ')}
                >
                  <Icon strokeWidth={1.8} className="h-[13px] w-[13px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.8px] leading-[1.45] text-text-default">
                    {t.rich(
                      event.type === 'PRODUCT_CREATED' && !categoryName
                        ? 'events.productCreatedNoCategory'
                        : messageKey,
                      {
                        b: (chunks) => <b className="font-semibold">{chunks}</b>,
                        ...values,
                      }
                    )}
                  </p>
                  <p className="mt-px text-[11px] text-text-subtle">{meta}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
