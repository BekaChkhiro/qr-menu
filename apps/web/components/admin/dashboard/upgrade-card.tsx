import Link from 'next/link';
import type { Plan } from '@prisma/client';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export interface UpgradeCardProps {
  plan: Plan;
}

type TargetPlan = 'STARTER' | 'PRO';

const TARGET_FOR: Record<Exclude<Plan, 'PRO'>, TargetPlan> = {
  FREE: 'STARTER',
  STARTER: 'PRO',
};

const PRICE_FOR: Record<TargetPlan, string> = {
  STARTER: '29',
  PRO: '59',
};

const FEATURE_KEYS: Record<TargetPlan, readonly ['one', 'two', 'three']> = {
  STARTER: ['one', 'two', 'three'],
  PRO: ['one', 'two', 'three'],
};

export async function UpgradeCard({ plan }: UpgradeCardProps) {
  if (plan === 'PRO') return null;

  const t = await getTranslations('admin.dashboard.upgradeCard');
  const target = TARGET_FOR[plan];
  const price = PRICE_FOR[target];
  const targetLower = target.toLowerCase() as 'starter' | 'pro';
  const featureKeys = FEATURE_KEYS[target];

  return (
    <section
      data-testid="dashboard-upgrade-card"
      data-current-plan={plan}
      data-target-plan={target}
      aria-label={t('ariaLabel', { plan: target })}
      className="relative overflow-hidden rounded-[14px] border border-white/10 px-6 py-5 text-white"
      style={{
        background: 'radial-gradient(ellipse at top left, #2A2A30, #18181B)',
      }}
    >
      {/* Terracotta corner glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(184,99,61,0.35), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 flex-1">
          {/* Target-tier badge */}
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-[5px] border border-white/[0.12] bg-white/[0.08] px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.4px]">
            <Sparkles
              strokeWidth={2}
              className="h-[11px] w-[11px]"
              style={{ color: '#E8B477' }}
            />
            <span style={{ color: '#E8B477' }}>{target}</span>
          </span>

          <h3 className="max-w-[480px] text-[19px] font-semibold leading-[1.25] tracking-[-0.3px]">
            {t(`title.${targetLower}`)}
          </h3>
          <p className="mt-1.5 max-w-[480px] text-[13px] text-white/60">
            {t(`subtitle.${targetLower}`)}
          </p>

          <ul className="mt-3.5 flex flex-col gap-1.5">
            {featureKeys.map((key) => (
              <li
                key={key}
                data-testid="dashboard-upgrade-feature"
                className="flex items-center gap-[9px] text-[13px] text-white/[0.88]"
              >
                <span
                  aria-hidden="true"
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(232,180,119,0.15)' }}
                >
                  <Check
                    strokeWidth={2.5}
                    className="h-2.5 w-2.5"
                    style={{ color: '#E8B477' }}
                  />
                </span>
                <span>{t(`features.${targetLower}.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-shrink-0 flex-col items-start md:items-end">
          <span className="text-[11px] text-white/50">{t('pricing.from')}</span>
          <span
            className="mt-0.5 font-semibold leading-none tracking-[-0.8px] tabular-nums"
            style={{ fontSize: 32 }}
          >
            {price}
            <span className="text-[18px] font-medium text-white/55">₾</span>
          </span>
          <span className="mb-3.5 mt-0.5 text-[11px] text-white/50">
            {t('pricing.perMonth')}
          </span>

          <Link
            href="/admin/settings/billing"
            data-testid="dashboard-upgrade-cta"
            className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-md bg-white px-5 py-2.5 text-[13px] font-semibold text-text-default transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181B]"
          >
            {t(`cta.${targetLower}`)}
            <ArrowRight strokeWidth={2} className="h-[13px] w-[13px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
