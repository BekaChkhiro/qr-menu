'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useLocale } from '@/hooks/use-locale';

const navigation = [
  { name: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'menus', href: '/admin/menus', icon: UtensilsCrossed },
  { name: 'settings', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  userName?: string | null;
  userPlan?: string;
}

export function Sidebar({ userName, userPlan = 'FREE' }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const locale = useLocale();
  const t = useTranslations('admin.sidebar');
  const tCommon = useTranslations('common');
  const tPlan = useTranslations('admin.settings.plan');
  const tA11y = useTranslations('common.accessibility');

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label={tA11y('mainNavigation')}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-sidebar-primary" />
            <span className="text-lg font-bold text-sidebar-primary">Digital Menu</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('h-8 w-8 text-sidebar-foreground', collapsed && 'mx-auto')}
          aria-expanded={!collapsed}
          aria-label={collapsed ? tA11y('openMenu') : tA11y('closeMenu')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 pt-6" role="navigation">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = t(item.name);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-4 rounded-full px-3.5 py-2.5 text-base font-medium transition-colors focus-ring',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-3'
              )}
              title={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
              {collapsed && <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div className="border-t border-sidebar-border px-4 py-2">
        <LanguageSwitcher
          currentLocale={locale}
          variant={collapsed ? 'compact' : 'default'}
          className={cn('w-full text-sidebar-foreground', collapsed ? 'justify-center' : 'justify-start')}
        />
      </div>

      {/* User Section */}
      <div className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-4 pt-2.5 pb-1.5">
            <p className="text-sm font-medium truncate text-sidebar-accent-foreground">{userName || 'User'}</p>
            <p className="text-xs text-sidebar-foreground">
              {tPlan(userPlan.toLowerCase() as 'free' | 'starter' | 'pro')}
            </p>
          </div>
        )}
        <div className="px-4 pb-2.5">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive focus-ring',
              collapsed && 'justify-center px-2'
            )}
            onClick={() => signOut({ callbackUrl: '/login' })}
            title={collapsed ? tCommon('nav.logout') : undefined}
            aria-label={tCommon('nav.logout')}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{tCommon('nav.logout')}</span>}
            {collapsed && <span className="sr-only">{tCommon('nav.logout')}</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
