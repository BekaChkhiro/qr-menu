'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bell,
  Building2,
  CreditCard,
  Globe,
  Shield,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type Plan = 'FREE' | 'STARTER' | 'PRO';

type NavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  showProBadgeForNonPro?: boolean;
};

const PERSONAL_ITEMS: readonly NavItem[] = [
  { key: 'profile', href: '/admin/settings/profile', icon: User, labelKey: 'profile' },
  {
    key: 'notifications',
    href: '/admin/settings/notifications',
    icon: Bell,
    labelKey: 'notifications',
  },
  { key: 'security', href: '/admin/settings/security', icon: Shield, labelKey: 'security' },
  { key: 'language', href: '/admin/settings/language', icon: Globe, labelKey: 'language' },
] as const;

const BUSINESS_ITEMS: readonly NavItem[] = [
  {
    key: 'business-info',
    href: '/admin/settings/business-info',
    icon: Building2,
    labelKey: 'businessInfo',
  },
  {
    key: 'billing',
    href: '/admin/settings/billing',
    icon: CreditCard,
    labelKey: 'billing',
  },
  {
    key: 'team',
    href: '/admin/settings/team',
    icon: Users,
    labelKey: 'team',
    showProBadgeForNonPro: true,
  },
] as const;

interface SettingsNavRailProps {
  plan: Plan;
}

export function SettingsNavRail({ plan }: SettingsNavRailProps) {
  const pathname = usePathname();
  const t = useTranslations('admin.settings.nav');

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      data-testid="settings-nav-rail"
      aria-label={t('ariaLabel')}
      className="flex h-full w-[220px] flex-shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-sidebar px-3 py-[22px]"
    >
      <GroupLabel>{t('personal')}</GroupLabel>
      {PERSONAL_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          item={item}
          active={isActive(item.href)}
          label={t(item.labelKey)}
          plan={plan}
        />
      ))}

      <div className="h-4" aria-hidden />

      <GroupLabel>{t('business')}</GroupLabel>
      {BUSINESS_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          item={item}
          active={isActive(item.href)}
          label={t(item.labelKey)}
          plan={plan}
        />
      ))}
    </nav>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 px-3.5 text-[10.5px] font-bold uppercase leading-none tracking-[0.6px] text-text-subtle">
      {children}
    </div>
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  label: string;
  plan: Plan;
}

function NavLink({ item, active, label, plan }: NavLinkProps) {
  const Icon = item.icon;
  const showBadge = item.showProBadgeForNonPro === true && plan !== 'PRO';

  return (
    <Link
      href={item.href}
      data-testid={`settings-nav-${item.key}`}
      data-active={active ? 'true' : 'false'}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-[9px] rounded-sm py-2 text-[13px] transition-colors',
        'border-l-2',
        active
          ? 'border-accent bg-sidebar pl-[10px] pr-3 font-semibold text-text-default'
          : 'border-transparent pl-3 pr-3 font-medium text-text-muted hover:bg-sidebar hover:text-text-default',
      )}
    >
      <Icon
        className={cn(active ? 'text-text-default' : 'text-text-subtle')}
        size={14}
        strokeWidth={active ? 1.9 : 1.5}
        aria-hidden
      />
      <span className="flex-1">{label}</span>
      {showBadge ? (
        <span
          data-testid={`settings-nav-${item.key}-pro-badge`}
          className="rounded-[3px] bg-success-soft px-1.5 text-[9.5px] font-bold leading-4 tracking-[0.4px] text-success"
        >
          PRO
        </span>
      ) : null}
    </Link>
  );
}
