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
  const tNav = useTranslations('nav');
  const tPlan = useTranslations('admin.settings.plan');

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="font-semibold">Digital Menu</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = t(item.name);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Language Switcher */}
      <div className="border-t p-2">
        <LanguageSwitcher
          currentLocale={locale}
          variant={collapsed ? 'compact' : 'default'}
          className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
        />
      </div>

      {/* User Section */}
      <div className="border-t p-2">
        {!collapsed && (
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium truncate">{userName || 'User'}</p>
            <p className="text-xs text-muted-foreground">
              {tPlan(userPlan.toLowerCase() as 'free' | 'starter' | 'pro')}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground hover:text-destructive',
            collapsed && 'justify-center px-2'
          )}
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? tNav('logout') : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{tNav('logout')}</span>}
        </Button>
      </div>
    </aside>
  );
}
