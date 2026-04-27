'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  UtensilsCrossed,
} from 'lucide-react';

import { MobileTabBar } from '@/components/ui/mobile-tab-bar';

const TABS = [
  { id: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'menus', href: '/admin/menus', icon: UtensilsCrossed },
  { id: 'analytics', href: '/admin/dashboard', icon: BarChart3 },
  { id: 'settings', href: '/admin/settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('admin.sidebar');

  const activeId =
    TABS.find((tab) => {
      if (tab.id === 'analytics') return false;
      return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
    })?.id ?? 'dashboard';

  const items = TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.id),
    icon: tab.icon,
    href: tab.href,
  }));

  return (
    <MobileTabBar
      items={items}
      activeId={activeId}
      aria-label={t('mobileNavLabel')}
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      data-testid="admin-mobile-tab-bar"
    />
  );
}
