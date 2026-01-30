'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles, Crown, Zap } from 'lucide-react';
import type { Plan } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLAN_LIMITS, PLAN_FEATURES } from '@/lib/auth/permissions';

type UpgradeReason =
  | 'menu_limit'
  | 'category_limit'
  | 'product_limit'
  | 'promotions'
  | 'allergens'
  | 'analytics'
  | 'multilingual'
  | 'custom_branding'
  | 'qr_logo';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: Plan;
  reason: UpgradeReason;
  currentCount?: number;
}

const REASON_DETAILS: Record<
  UpgradeReason,
  {
    icon: typeof Sparkles;
    requiredPlan: Plan;
  }
> = {
  menu_limit: { icon: Zap, requiredPlan: 'STARTER' },
  category_limit: { icon: Zap, requiredPlan: 'STARTER' },
  product_limit: { icon: Zap, requiredPlan: 'STARTER' },
  promotions: { icon: Sparkles, requiredPlan: 'STARTER' },
  custom_branding: { icon: Sparkles, requiredPlan: 'STARTER' },
  allergens: { icon: Crown, requiredPlan: 'PRO' },
  analytics: { icon: Crown, requiredPlan: 'PRO' },
  multilingual: { icon: Crown, requiredPlan: 'PRO' },
  qr_logo: { icon: Crown, requiredPlan: 'PRO' },
};

export function UpgradePrompt({
  open,
  onOpenChange,
  currentPlan,
  reason,
  currentCount,
}: UpgradePromptProps) {
  const t = useTranslations('admin.upgrade');
  const tPlan = useTranslations('admin.settings.plan');

  const details = REASON_DETAILS[reason];
  const Icon = details.icon;
  const suggestedPlan = details.requiredPlan;

  const getReasonTitle = () => {
    switch (reason) {
      case 'menu_limit':
        return t('reasons.menuLimit.title');
      case 'category_limit':
        return t('reasons.categoryLimit.title');
      case 'product_limit':
        return t('reasons.productLimit.title');
      case 'promotions':
        return t('reasons.promotions.title');
      case 'allergens':
        return t('reasons.allergens.title');
      case 'analytics':
        return t('reasons.analytics.title');
      case 'multilingual':
        return t('reasons.multilingual.title');
      case 'custom_branding':
        return t('reasons.customBranding.title');
      case 'qr_logo':
        return t('reasons.qrLogo.title');
    }
  };

  const getReasonDescription = () => {
    const limit = getLimitForReason();
    const count = currentCount ?? 0;
    switch (reason) {
      case 'menu_limit':
        return t('reasons.menuLimit.description', { limit, count });
      case 'category_limit':
        return t('reasons.categoryLimit.description', { limit, count });
      case 'product_limit':
        return t('reasons.productLimit.description', { limit, count });
      case 'promotions':
        return t('reasons.promotions.description');
      case 'allergens':
        return t('reasons.allergens.description');
      case 'analytics':
        return t('reasons.analytics.description');
      case 'multilingual':
        return t('reasons.multilingual.description');
      case 'custom_branding':
        return t('reasons.customBranding.description');
      case 'qr_logo':
        return t('reasons.qrLogo.description');
    }
  };

  const getLimitForReason = (): number | string => {
    const limits = PLAN_LIMITS[currentPlan];
    switch (reason) {
      case 'menu_limit':
        return limits.maxMenus;
      case 'category_limit':
        return limits.maxCategories === Infinity ? '∞' : limits.maxCategories;
      case 'product_limit':
        return limits.maxProducts === Infinity ? '∞' : limits.maxProducts;
      default:
        return 0;
    }
  };

  const getPlanBenefits = (plan: Plan) => {
    const features = PLAN_FEATURES[plan];
    const limits = PLAN_LIMITS[plan];
    const benefits: string[] = [];

    if (limits.maxMenus === Infinity) {
      benefits.push(t('benefits.unlimitedMenus'));
    } else if (limits.maxMenus > PLAN_LIMITS.FREE.maxMenus) {
      benefits.push(t('benefits.moreMenus', { count: limits.maxMenus }));
    }

    if (limits.maxCategories === Infinity) {
      benefits.push(t('benefits.unlimitedCategories'));
    }

    if (limits.maxProducts === Infinity) {
      benefits.push(t('benefits.unlimitedProducts'));
    }

    if (features.promotions) benefits.push(t('benefits.promotions'));
    if (features.customBranding) benefits.push(t('benefits.customBranding'));
    if (features.allergens) benefits.push(t('benefits.allergens'));
    if (features.analytics) benefits.push(t('benefits.analytics'));
    if (features.multilingual) benefits.push(t('benefits.multilingual'));
    if (features.qrWithLogo) benefits.push(t('benefits.qrLogo'));

    return benefits.slice(0, 4); // Show top 4 benefits
  };

  const suggestedBenefits = getPlanBenefits(suggestedPlan);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{getReasonTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {getReasonDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium">
              {tPlan(suggestedPlan.toLowerCase() as 'free' | 'starter' | 'pro')}
            </span>
            <Badge variant="default">
              {t('recommended')}
            </Badge>
          </div>
          <ul className="space-y-2 text-sm">
            {suggestedBenefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link href="/admin/settings">
              <Sparkles className="mr-2 h-4 w-4" />
              {t('upgradeNow')}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {t('maybeLater')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
