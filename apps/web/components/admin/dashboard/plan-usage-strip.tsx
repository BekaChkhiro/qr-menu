import Link from 'next/link';
import type { Plan } from '@prisma/client';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';

// Storage limits in megabytes per plan — not represented in the DB schema,
// so we hard-code the plan caps here. Matches the handoff design values.
const STORAGE_LIMIT_MB: Record<Plan, number> = {
  FREE: 100,
  STARTER: 1024,
  PRO: 10240,
};

export interface PlanUsageStripProps {
  plan: Plan;
  counts: {
    menus: number;
    menusLimit: number;
    categories: number;
    categoriesLimit: number;
    products: number;
    productsLimit: number;
    /** Estimated MB of images stored. Approximated from product-image count. */
    storageMb: number;
  };
}

type Tone = 'default' | 'warning' | 'danger';

interface UsageCardProps {
  label: string;
  usedDisplay: string;
  totalDisplay: string;
  percent: number;
  tone: Tone;
  /** True when the plan offers an unlimited quota for this metric. */
  unlimited: boolean;
  unlimitedLabel: string;
  testId: string;
}

const FILL_TONE: Record<Tone, string> = {
  default: 'bg-text-default',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

const VALUE_TONE: Record<Tone, string> = {
  default: 'text-text-default',
  warning: 'text-warning',
  danger: 'text-danger',
};

function toneForPercent(percent: number, unlimited: boolean): Tone {
  if (unlimited) return 'default';
  if (percent >= 100) return 'danger';
  if (percent >= 80) return 'warning';
  return 'default';
}

function UsageCard({
  label,
  usedDisplay,
  totalDisplay,
  percent,
  tone,
  unlimited,
  unlimitedLabel,
  testId,
}: UsageCardProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      data-testid={testId}
      data-tone={tone}
      data-unlimited={unlimited ? 'true' : undefined}
      className="flex-1 min-w-[150px] rounded-card border border-border bg-card px-4 py-3.5"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] font-medium text-text-muted">{label}</span>
        <span className="text-[11.5px] tabular-nums text-text-subtle">
          {unlimited ? unlimitedLabel : `${Math.round(clamped)}%`}
        </span>
      </div>

      <div className="mt-2.5 flex items-baseline gap-1 tabular-nums">
        <span
          className={cn(
            'text-[22px] font-semibold tracking-[-0.4px] leading-none',
            VALUE_TONE[tone],
          )}
        >
          {usedDisplay}
        </span>
        <span className="text-[13px] text-text-muted">/ {totalDisplay}</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={unlimited ? undefined : Math.round(clamped)}
        aria-label={label}
        className="mt-2.5 h-1 overflow-hidden rounded-[2px] bg-border-soft"
      >
        {unlimited ? (
          <div
            data-testid="usage-progress-fill"
            className="h-full rounded-[2px] bg-chip"
            style={{ width: '20%' }}
          />
        ) : (
          <div
            data-testid="usage-progress-fill"
            className={cn('h-full rounded-[2px]', FILL_TONE[tone])}
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
    </div>
  );
}

function formatStorage(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

export async function PlanUsageStrip({ plan, counts }: PlanUsageStripProps) {
  const t = await getTranslations('admin.dashboard.usage');
  const tPlan = await getTranslations('admin.settings.plan');

  const storageLimitMb = STORAGE_LIMIT_MB[plan];

  const metrics = [
    {
      testId: 'usage-card-menus',
      label: t('menus'),
      used: counts.menus,
      limit: counts.menusLimit,
      usedDisplay: String(counts.menus),
      totalDisplay: Number.isFinite(counts.menusLimit)
        ? String(counts.menusLimit)
        : '∞',
      unlimited: !Number.isFinite(counts.menusLimit),
    },
    {
      testId: 'usage-card-categories',
      label: t('categories'),
      used: counts.categories,
      limit: counts.categoriesLimit,
      usedDisplay: String(counts.categories),
      totalDisplay: Number.isFinite(counts.categoriesLimit)
        ? String(counts.categoriesLimit)
        : '∞',
      unlimited: !Number.isFinite(counts.categoriesLimit),
    },
    {
      testId: 'usage-card-products',
      label: t('products'),
      used: counts.products,
      limit: counts.productsLimit,
      usedDisplay: String(counts.products),
      totalDisplay: Number.isFinite(counts.productsLimit)
        ? String(counts.productsLimit)
        : '∞',
      unlimited: !Number.isFinite(counts.productsLimit),
    },
    {
      testId: 'usage-card-storage',
      label: t('storage'),
      used: counts.storageMb,
      limit: storageLimitMb,
      usedDisplay: formatStorage(counts.storageMb),
      totalDisplay: formatStorage(storageLimitMb),
      unlimited: false,
    },
  ];

  const planName = tPlan(plan.toLowerCase() as 'free' | 'starter' | 'pro');

  return (
    <section
      data-testid="plan-usage-strip"
      data-plan={plan}
      aria-label={t('sectionLabel', { plan: planName })}
      className="space-y-2.5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        {metrics.map((m) => {
          const percent = m.unlimited ? 0 : (m.used / m.limit) * 100;
          const tone = toneForPercent(percent, m.unlimited);
          return (
            <UsageCard
              key={m.testId}
              testId={m.testId}
              label={m.label}
              usedDisplay={m.usedDisplay}
              totalDisplay={m.totalDisplay}
              percent={percent}
              tone={tone}
              unlimited={m.unlimited}
              unlimitedLabel={t('unlimited')}
            />
          );
        })}
      </div>

      {plan !== 'PRO' && (
        <Link
          href="/admin/settings/billing"
          data-testid="plan-usage-upgrade"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:underline"
        >
          <Sparkles className="h-3 w-3" strokeWidth={1.5} />
          {t('upgradeCta')}
          <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
        </Link>
      )}
    </section>
  );
}
