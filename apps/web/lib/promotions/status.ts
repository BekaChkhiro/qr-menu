import { hasEnded, isScheduled, type PromotionDates } from '@/lib/promotions/time-windows';

// T1.7 — what the editor card, list and filter tabs call a promotion.
//
// The on/off switch comes first: a switched-off promotion is "paused" even when
// its dates have also run out, so it never reads as finished while the owner
// has simply turned it off. Date limits only decide the status of a promotion
// that is switched on.
export type PromotionStatus = 'active' | 'scheduled' | 'ended' | 'paused';

export function getPromotionStatus(
  promotion: PromotionDates & { isActive: boolean },
  now: Date = new Date(),
): PromotionStatus {
  if (!promotion.isActive) return 'paused';
  if (hasEnded(promotion, now)) return 'ended';
  if (isScheduled(promotion, now)) return 'scheduled';
  return 'active';
}
