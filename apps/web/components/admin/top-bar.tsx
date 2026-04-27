'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import {
  Bell,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Search,
  Settings as SettingsIcon,
  User as UserIcon,
  UtensilsCrossed,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  useCommandPaletteHotkey,
} from '@/components/ui/command-palette';

interface AdminTopBarProps {
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string;
  hasUnreadNotifications?: boolean;
  /**
   * Override the auto-derived breadcrumbs. Used by the test showcase page so
   * we can render an admin-like route trail outside the real admin routes.
   */
  crumbs?: BreadcrumbItem[];
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

type CrumbKey =
  | 'dashboard'
  | 'menus'
  | 'settings'
  | 'newMenu'
  | 'editMenu'
  | 'profile'
  | 'business'
  | 'billing'
  | 'team'
  | 'notifications'
  | 'security'
  | 'language';

const SETTINGS_CHILD_KEYS: Record<string, CrumbKey> = {
  profile: 'profile',
  'business-info': 'business',
  billing: 'billing',
  team: 'team',
  notifications: 'notifications',
  security: 'security',
  language: 'language',
};

function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const tCrumb = useTranslations('admin.breadcrumbs');

  return useMemo<BreadcrumbItem[]>(() => {
    const segs = pathname.split('/').filter(Boolean);
    if (segs[0] !== 'admin') return [];

    const crumbs: BreadcrumbItem[] = [];
    const [, section, child] = segs;

    if (!section || section === 'dashboard') {
      crumbs.push({ label: tCrumb('dashboard') });
      return crumbs;
    }

    crumbs.push({ label: tCrumb('dashboard'), href: '/admin/dashboard' });

    if (section === 'menus') {
      if (!child) {
        crumbs.push({ label: tCrumb('menus') });
      } else {
        crumbs.push({ label: tCrumb('menus'), href: '/admin/menus' });
        crumbs.push({
          label: child === 'new' ? tCrumb('newMenu') : tCrumb('editMenu'),
        });
      }
      return crumbs;
    }

    if (section === 'settings') {
      if (!child) {
        crumbs.push({ label: tCrumb('settings') });
      } else {
        crumbs.push({ label: tCrumb('settings'), href: '/admin/settings' });
        const key = SETTINGS_CHILD_KEYS[child];
        crumbs.push({ label: key ? tCrumb(key) : child });
      }
      return crumbs;
    }

    crumbs.push({ label: section });
    return crumbs;
  }, [pathname, tCrumb]);
}

export function AdminTopBar({
  userName,
  userEmail,
  userPlan,
  hasUnreadNotifications = false,
  crumbs: crumbsOverride,
}: AdminTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('admin.topbar');

  const [paletteOpen, setPaletteOpen] = useState(false);
  const togglePalette = useCallback(() => setPaletteOpen((v) => !v), []);
  useCommandPaletteHotkey(togglePalette);

  const derivedCrumbs = useBreadcrumbs(pathname);
  const crumbs = crumbsOverride ?? derivedCrumbs;
  const initials = initialsFrom(userName);

  const navigate = useCallback(
    (href: string) => {
      setPaletteOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <header
        data-testid="admin-topbar"
        data-has-unread={hasUnreadNotifications ? 'true' : 'false'}
        className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-bg px-6"
      >
        {/* Desktop breadcrumbs */}
        <div className="hidden md:block">
          {crumbs.length > 0 ? (
            <Breadcrumbs items={crumbs} data-testid="topbar-breadcrumbs" />
          ) : (
            <div />
          )}
        </div>

        {/* Mobile: back button + current page title */}
        <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
          {(() => {
            const parent =
              crumbs.length > 1
                ? crumbs
                    .slice(0, -1)
                    .reverse()
                    .find((c) => c.href)
                : undefined;
            return parent ? (
              <button
                type="button"
                onClick={() => navigate(parent.href!)}
                className="shrink-0 rounded-sm p-1 text-text-default transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={t('backTo', { page: parent.label })}
                data-testid="topbar-back"
              >
                <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            ) : null;
          })()}
          {crumbs.length > 0 && (
            <span
              className="truncate text-[13.5px] font-semibold text-text-default"
              data-testid="topbar-mobile-title"
            >
              {crumbs[crumbs.length - 1].label}
            </span>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          data-testid="topbar-search"
          className={cn(
            'hidden md:flex w-[240px] items-center gap-2 rounded-md border border-border bg-card px-[10px] py-[6px] text-left',
            'hover:border-text-subtle transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          <Search
            size={14}
            strokeWidth={1.5}
            className="shrink-0 text-text-subtle"
            aria-hidden="true"
          />
          <span className="flex-1 truncate text-[13px] text-text-subtle">
            {t('searchPlaceholder')}
          </span>
          <kbd className="shrink-0 rounded-xs border border-border px-[5px] py-[1px] font-mono text-[10px] leading-none text-text-subtle">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          data-testid="topbar-notifications"
          aria-label={
            hasUnreadNotifications
              ? t('notificationsUnread')
              : t('notifications')
          }
          className={cn(
            'relative rounded-md p-2 text-text-default',
            'hover:bg-chip transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          <Bell size={17} strokeWidth={1.5} aria-hidden="true" />
          {hasUnreadNotifications && (
            <span
              data-testid="topbar-notifications-dot"
              aria-hidden="true"
              className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full bg-accent ring-[1.5px] ring-bg"
            />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="topbar-user-trigger"
              aria-label={t('userMenu')}
              className={cn(
                'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-accent',
                'text-[11.5px] font-semibold text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              )}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            data-testid="topbar-user-menu"
            className="min-w-[220px]"
          >
            <DropdownMenuLabel className="flex flex-col gap-[2px] px-2 py-2">
              <span className="text-[13px] font-semibold text-text-default">
                {userName ?? 'User'}
              </span>
              {userEmail && (
                <span className="text-[11.5px] font-normal text-text-muted">
                  {userEmail}
                </span>
              )}
              {userPlan && (
                <span className="mt-[2px] text-[10.5px] font-bold uppercase tracking-[0.4px] text-text-subtle">
                  {userPlan}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="topbar-user-menu-profile"
              onSelect={() => navigate('/admin/settings/profile')}
              className="cursor-pointer"
            >
              <UserIcon size={14} strokeWidth={1.5} />
              <span>{t('profile')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="topbar-user-menu-settings"
              onSelect={() => navigate('/admin/settings')}
              className="cursor-pointer"
            >
              <SettingsIcon size={14} strokeWidth={1.5} />
              <span>{t('settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="topbar-user-menu-signout"
              onSelect={() => signOut({ callbackUrl: '/login' })}
              className="cursor-pointer text-danger focus:text-danger"
            >
              <LogOut size={14} strokeWidth={1.5} />
              <span>{t('signOut')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandPaletteInput
          placeholder={t('searchPlaceholder')}
          data-testid="command-palette-input"
        />
        <CommandPaletteList data-testid="command-palette-list">
          <CommandPaletteEmpty>{t('paletteEmpty')}</CommandPaletteEmpty>
          <CommandPaletteGroup heading={t('paletteGroupNav')}>
            <CommandPaletteItem
              icon={LayoutDashboard}
              title="Dashboard"
              data-testid="command-palette-nav-dashboard"
              onSelect={() => navigate('/admin/dashboard')}
            />
            <CommandPaletteItem
              icon={UtensilsCrossed}
              title="Menus"
              data-testid="command-palette-nav-menus"
              onSelect={() => navigate('/admin/menus')}
            />
            <CommandPaletteItem
              icon={SettingsIcon}
              title="Settings"
              data-testid="command-palette-nav-settings"
              onSelect={() => navigate('/admin/settings')}
            />
          </CommandPaletteGroup>
        </CommandPaletteList>
        <CommandPaletteFooter />
      </CommandPalette>
    </>
  );
}
