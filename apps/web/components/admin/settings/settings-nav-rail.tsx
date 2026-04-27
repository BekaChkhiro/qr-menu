'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bell,
  Building2,
  ChevronDown,
  CreditCard,
  Globe,
  Shield,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type Plan = 'FREE' | 'STARTER' | 'PRO';

type NavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  showProBadgeForNonPro?: boolean;
};

export const PERSONAL_ITEMS: readonly NavItem[] = [
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

export const BUSINESS_ITEMS: readonly NavItem[] = [
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

const ALL_ITEMS: readonly NavItem[] = [...PERSONAL_ITEMS, ...BUSINESS_ITEMS];

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
      className="hidden h-full w-[220px] flex-shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-sidebar px-3 py-[22px] md:flex"
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

export function SettingsMobileAccordion({ plan }: { plan: Plan }) {
  const pathname = usePathname();
  const t = useTranslations('admin.settings.nav');
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeItem = ALL_ITEMS.find((item) => isActive(item.href));
  const ActiveIcon = activeItem?.icon ?? User;

  return (
    <div className="md:hidden">
      <Collapsible open={open} onOpenChange={setOpen} data-testid="settings-mobile-accordion">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            data-testid="settings-mobile-accordion-trigger"
            aria-expanded={open}
            className={cn(
              'flex w-full items-center gap-3 border-b border-border bg-card px-4 py-3 text-left',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            )}
          >
            <ActiveIcon size={16} strokeWidth={1.5} className="text-text-default" aria-hidden />
            <span className="flex-1 text-[13.5px] font-semibold text-text-default">
              {activeItem ? t(activeItem.labelKey) : t('profile')}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={1.5}
              className={cn(
                'text-text-muted transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent data-testid="settings-mobile-accordion-content">
          <div className="border-b border-border bg-card">
            <MobileGroupLabel>{t('personal')}</MobileGroupLabel>
            {PERSONAL_ITEMS.map((item) => (
              <MobileNavLink
                key={item.key}
                item={item}
                active={isActive(item.href)}
                label={t(item.labelKey)}
                plan={plan}
                onNavigate={() => setOpen(false)}
              />
            ))}

            <div className="h-2" aria-hidden />

            <MobileGroupLabel>{t('business')}</MobileGroupLabel>
            {BUSINESS_ITEMS.map((item) => (
              <MobileNavLink
                key={item.key}
                item={item}
                active={isActive(item.href)}
                label={t(item.labelKey)}
                plan={plan}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 px-3.5 text-[10.5px] font-bold uppercase leading-none tracking-[0.6px] text-text-subtle">
      {children}
    </div>
  );
}

function MobileGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-1.5 text-[10.5px] font-bold uppercase leading-none tracking-[0.6px] text-text-subtle">
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

interface MobileNavLinkProps extends NavLinkProps {
  onNavigate: () => void;
}

function MobileNavLink({ item, active, label, plan, onNavigate }: MobileNavLinkProps) {
  const Icon = item.icon;
  const showBadge = item.showProBadgeForNonPro === true && plan !== 'PRO';

  return (
    <Link
      href={item.href}
      data-testid={`settings-nav-${item.key}`}
      data-active={active ? 'true' : 'false'}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-4 py-3 text-[13.5px] transition-colors',
        active
          ? 'font-semibold text-text-default'
          : 'font-medium text-text-muted hover:bg-chip hover:text-text-default',
      )}
    >
      <Icon
        className={cn(active ? 'text-text-default' : 'text-text-subtle')}
        size={16}
        strokeWidth={active ? 1.8 : 1.5}
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
