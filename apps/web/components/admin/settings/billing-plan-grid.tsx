'use client';

import type { Plan } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PlanKey = 'FREE' | 'STARTER' | 'PRO';

interface PlanCardDef {
  key: PlanKey;
  price: number;
  ctaKey: string;
  features: string[];
}

const PLAN_DEFS: PlanCardDef[] = [
  {
    key: 'FREE',
    price: 0,
    ctaKey: 'downgrade',
    features: [
      '1 menu',
      '3 categories',
      '15 products',
      'Basic QR only',
      'Single language',
    ],
  },
  {
    key: 'STARTER',
    price: 29,
    ctaKey: 'upgrade',
    features: [
      '3 menus',
      'Unlimited categories & items',
      'Promotions & happy hours',
      'Custom branding & colors',
      'Basic analytics',
    ],
  },
  {
    key: 'PRO',
    price: 59,
    ctaKey: 'upgrade',
    features: [
      'Unlimited everything',
      'Multilingual menus (KA/EN/RU)',
      'Allergen & dietary tags',
      'Full analytics & heatmaps',
      'QR with logo & brand colors',
      'Team seats',
    ],
  },
];

interface BillingPlanGridProps {
  currentPlan: Plan;
}

export function BillingPlanGrid({ currentPlan }: BillingPlanGridProps) {
  const t = useTranslations('admin.settings.billing');

  const handleStubAction = () => {
    toast(t('upgradeToast'), {
      duration: 4000,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PLAN_DEFS.map((def) => {
        const isCurrent = def.key === currentPlan;
        const isHighlighted = isCurrent;

        return (
          <div
            key={def.key}
            data-testid={`billing-plan-card-${def.key.toLowerCase()}`}
            data-current={isCurrent ? 'true' : 'false'}
            className={cn(
              'relative flex flex-col rounded-card bg-card p-5',
              isHighlighted
                ? 'border-2 border-text-default shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
                : 'border border-border'
            )}
          >
            {isCurrent && (
              <span className="absolute right-3.5 top-3.5 rounded-[4px] bg-success-soft px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.4px] text-success">
                {t('currentBadge')}
              </span>
            )}

            <div className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.6px] text-text-subtle">
              {t(`planNames.${def.key.toLowerCase() as 'free' | 'starter' | 'pro'}`)}
            </div>

            <div className="text-[28px] font-semibold leading-none tracking-[-0.5px] text-text-default tabular-nums">
              {def.price === 0 ? '0₾' : `${def.price}₾`}
              <span className="ml-1 text-[13px] font-normal text-text-muted">
                / {t('perMonth')}
              </span>
            </div>

            <div className="my-4 h-px bg-border" />

            <ul className="mb-4 flex flex-1 flex-col gap-2">
              {def.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[12.5px] leading-[1.45] text-text-default"
                >
                  <Check
                    className="mt-[2px] h-[13px] w-[13px] flex-shrink-0 text-success"
                    strokeWidth={2.4}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={handleStubAction}
                data-testid="billing-plan-manage"
              >
                {t('manage')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant={isHighlighted ? 'primary' : 'secondary'}
                className="w-full"
                onClick={handleStubAction}
                data-testid={`billing-plan-cta-${def.key.toLowerCase()}`}
              >
                {def.key === 'FREE'
                  ? t('downgrade')
                  : def.key === 'PRO'
                    ? t('upgradeToPro')
                    : t('upgrade')}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
