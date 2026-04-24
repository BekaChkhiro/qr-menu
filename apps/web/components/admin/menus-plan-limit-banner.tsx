import Link from 'next/link';
import type { Plan } from '@prisma/client';
import { Lock, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { PLAN_LIMITS } from '@/lib/auth/permissions';

export interface MenusPlanLimitBannerProps {
  plan: Plan;
  menuCount: number;
}

type TargetPlan = 'STARTER' | 'PRO';

const TARGET_FOR: Record<Exclude<Plan, 'PRO'>, TargetPlan> = {
  FREE: 'STARTER',
  STARTER: 'PRO',
};

export async function MenusPlanLimitBanner({
  plan,
  menuCount,
}: MenusPlanLimitBannerProps) {
  if (plan === 'PRO') return null;

  const limit = PLAN_LIMITS[plan].maxMenus;
  if (!Number.isFinite(limit) || menuCount < limit) return null;

  const target = TARGET_FOR[plan];
  const targetLower = target.toLowerCase() as 'starter' | 'pro';
  const t = await getTranslations('admin.menus.limitBanner');

  return (
    <section
      role="alert"
      aria-live="polite"
      data-testid="menus-plan-limit-banner"
      data-current-plan={plan}
      data-target-plan={target}
      className="mt-5 flex items-center gap-3.5 rounded-[10px] border border-warning-soft border-l-[3px] border-l-warning bg-card px-[18px] py-3.5 sm:gap-4"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning"
      >
        <Lock strokeWidth={1.8} size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold leading-tight text-text-default">
          {t(`title.${targetLower}`, { limit })}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-text-muted">
          {t(`description.${targetLower}`)}
        </p>
      </div>
      <Link
        href="/admin/settings/billing"
        data-testid="menus-plan-limit-banner-cta"
        className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-text-default px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-text-default/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <Sparkles strokeWidth={2} className="h-3.5 w-3.5" />
        {t(`cta.${targetLower}`)}
      </Link>
    </section>
  );
}
