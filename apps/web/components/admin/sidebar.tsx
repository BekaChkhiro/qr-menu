'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

import { cn } from '@/lib/utils';
import { SidebarItem } from '@/components/ui/sidebar-item';

const STORAGE_KEY = 'dm.sidebar.collapsed';

const NAV_ITEMS = [
  { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'menus', href: '/admin/menus', icon: UtensilsCrossed },
  { key: 'settings', href: '/admin/settings', icon: Settings },
] as const;

type PlanTier = 'FREE' | 'STARTER' | 'PRO';

const PLAN_STYLES: Record<PlanTier, { pill: string; label: string }> = {
  FREE: { pill: 'bg-chip text-text-muted', label: 'FREE' },
  STARTER: { pill: 'bg-warning-soft text-warning', label: 'STARTER' },
  PRO: { pill: 'bg-success-soft text-success', label: 'PRO' },
};

function normalizePlan(value: string | undefined): PlanTier {
  if (value === 'STARTER' || value === 'PRO') return value;
  return 'FREE';
}

function initialsFrom(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const letters = parts
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return (letters || name[0] || 'U').toUpperCase();
}

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string;
  businessName?: string;
  businessLocation?: string;
}

export function Sidebar({
  userName,
  userEmail,
  userPlan,
  businessName = 'Café Linville',
  businessLocation = 'Tbilisi · Vera',
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('admin.sidebar');
  const tCommon = useTranslations('common');
  const tA11y = useTranslations('common.accessibility');

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'true') {
        setCollapsed(true);
      }
    } catch {
      // localStorage unavailable (private mode / SSR edge) — keep default
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const plan = normalizePlan(userPlan);
  const planStyles = PLAN_STYLES[plan];
  const initials = initialsFrom(userName);

  return (
    <aside
      className={cn(
        'relative flex h-full shrink-0 flex-col border-r border-border bg-sidebar',
        'transition-[width] duration-[220ms] ease-[cubic-bezier(0.2,0.8,0.3,1)]',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label={tA11y('mainNavigation')}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-testid="admin-sidebar"
    >
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-border-soft',
          collapsed ? 'justify-center px-0' : 'justify-between px-4',
        )}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-[9px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          aria-label="Digital Menu — Home"
        >
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-text-default text-[13px] font-bold -tracking-[0.02em] text-white">
            D
          </div>
          {!collapsed && (
            <span className="truncate text-[14.5px] font-semibold -tracking-[0.01em] text-text-default">
              Digital Menu
            </span>
          )}
        </Link>
      </div>

      {/* Floating collapse toggle — overlaps the right edge. */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="absolute -right-[10px] top-[22px] z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-text-subtle shadow-xs transition-colors hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={collapsed ? tA11y('openMenu') : tA11y('closeMenu')}
        aria-expanded={!collapsed}
        data-testid="sidebar-toggle"
      >
        {collapsed ? (
          <ChevronRight size={12} strokeWidth={1.8} aria-hidden="true" />
        ) : (
          <ChevronLeft size={12} strokeWidth={1.8} aria-hidden="true" />
        )}
      </button>

      {/* Org switcher (expanded only) */}
      {!collapsed && (
        <div className="px-[10px] pt-[10px] pb-[6px]">
          <button
            type="button"
            className="flex w-full items-center gap-[9px] rounded-md border border-border bg-card px-[10px] py-2 text-left transition-colors hover:border-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            data-testid="sidebar-org-switcher"
          >
            <div
              aria-hidden="true"
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] bg-gradient-to-br from-accent to-[#8A4428] text-[10.5px] font-bold text-white"
            >
              {businessName
                .split(/\s+/)
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium leading-[1.1] text-text-default">
                {businessName}
              </div>
              <div className="mt-[2px] truncate text-[10.5px] leading-[1.1] text-text-muted">
                {businessLocation}
              </div>
            </div>
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              className="shrink-0 text-text-muted"
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          'flex flex-1 flex-col gap-[2px]',
          collapsed ? 'px-2 py-[10px]' : 'px-[10px] py-[6px]',
        )}
        role="navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={t(item.key)}
              href={item.href}
              active={isActive}
              collapsed={collapsed}
              data-testid={`sidebar-nav-${item.key}`}
            />
          );
        })}
      </nav>

      {/* Plan badge + upgrade CTA */}
      {collapsed ? (
        <div className="flex justify-center pb-[10px]" data-testid="sidebar-plan">
          <span
            className={cn(
              'inline-block w-9 rounded-[5px] py-1 text-center text-[9px] font-bold uppercase tracking-[0.4px]',
              planStyles.pill,
            )}
          >
            {planStyles.label.slice(0, 3)}
          </span>
        </div>
      ) : (
        <div
          className="border-t border-border-soft px-[14px] pt-3 pb-[10px]"
          data-testid="sidebar-plan"
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                'rounded-xs px-[7px] py-[2px] text-[10.5px] font-bold uppercase tracking-[0.4px]',
                planStyles.pill,
              )}
            >
              {planStyles.label}
            </span>
            <span className="text-xs text-text-muted">{t('planLabel')}</span>
          </div>
          {plan !== 'PRO' && (
            <Link
              href="/admin/settings/billing"
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-card px-[10px] py-[7px] text-[12.5px] font-medium text-text-default transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              data-testid="sidebar-upgrade-cta"
            >
              <Sparkles
                size={13}
                strokeWidth={1.5}
                className="text-accent"
                aria-hidden="true"
              />
              {t('upgradeToPro')}
            </Link>
          )}
        </div>
      )}

      {/* User row */}
      <div
        className={cn(
          'border-t border-border-soft',
          collapsed
            ? 'flex justify-center py-[10px]'
            : 'flex items-center gap-[10px] px-[10px] py-[10px]',
        )}
        data-testid="sidebar-user"
      >
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white"
        >
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium leading-[1.2] text-text-default">
                {userName ?? 'User'}
              </div>
              {userEmail && (
                <div className="truncate text-[11.5px] leading-[1.2] text-text-muted">
                  {userEmail}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="shrink-0 rounded-sm p-1 text-text-muted transition-colors hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={tCommon('nav.logout')}
              data-testid="sidebar-logout"
            >
              <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
