'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PlanLimitIndicatorProps {
  current: number;
  limit: number;
  resource: 'menu' | 'category' | 'product';
  showProgress?: boolean;
  className?: string;
}

export function PlanLimitIndicator({
  current,
  limit,
  resource,
  showProgress = true,
  className,
}: PlanLimitIndicatorProps) {
  const t = useTranslations('admin.limits');

  const isUnlimited = limit === Infinity;
  const isAtLimit = !isUnlimited && current >= limit;
  const isNearLimit = !isUnlimited && current >= limit * 0.8;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);

  const getResourceLabel = () => {
    switch (resource) {
      case 'menu':
        return t('menus');
      case 'category':
        return t('categories');
      case 'product':
        return t('products');
    }
  };

  const getStatusColor = () => {
    if (isUnlimited) return 'text-muted-foreground';
    if (isAtLimit) return 'text-destructive';
    if (isNearLimit) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-muted-foreground';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-destructive';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getIcon = () => {
    if (isAtLimit) return AlertCircle;
    if (isNearLimit) return Info;
    return CheckCircle2;
  };

  const Icon = getIcon();

  if (isUnlimited) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm', className)}>
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        <span className="text-muted-foreground">
          {current} {getResourceLabel()}
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            <Icon className={cn('h-3.5 w-3.5', getStatusColor())} />
            <div className="flex items-center gap-1.5">
              <span className={cn('text-sm font-medium', getStatusColor())}>
                {current}/{limit}
              </span>
              <span className="text-sm text-muted-foreground">
                {getResourceLabel()}
              </span>
            </div>
            {showProgress && (
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full transition-all', getProgressColor())}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isAtLimit ? (
            <p>{t('atLimit', { resource: getResourceLabel() })}</p>
          ) : isNearLimit ? (
            <p>{t('nearLimit', { remaining: limit - current, resource: getResourceLabel() })}</p>
          ) : (
            <p>{t('remaining', { remaining: limit - current, resource: getResourceLabel() })}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface PlanLimitBadgeProps {
  current: number;
  limit: number;
  resource: 'menu' | 'category' | 'product';
  className?: string;
}

export function PlanLimitBadge({
  current,
  limit,
  resource,
  className,
}: PlanLimitBadgeProps) {
  const t = useTranslations('admin.limits');

  const isUnlimited = limit === Infinity;
  const isAtLimit = !isUnlimited && current >= limit;

  if (isUnlimited) {
    return null;
  }

  const getResourceLabel = () => {
    switch (resource) {
      case 'menu':
        return t('menus');
      case 'category':
        return t('categories');
      case 'product':
        return t('products');
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        isAtLimit
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      {current}/{limit} {getResourceLabel()}
    </span>
  );
}
