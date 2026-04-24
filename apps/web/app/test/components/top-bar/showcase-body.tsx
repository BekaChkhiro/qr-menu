'use client';

import { AdminTopBar } from '@/components/admin/top-bar';

export function ShowcaseBody() {
  return (
    <main
      data-testid="admin-topbar-showcase"
      className="min-h-screen bg-bg px-6 py-12 font-sans text-text-default"
    >
      <div className="mx-auto max-w-6xl space-y-12">
        <header>
          <p className="mb-2 text-overline uppercase tracking-widest text-text-muted">
            T11.2 Admin TopBar
          </p>
          <h1 className="text-display text-text-default">Admin TopBar</h1>
          <p className="mt-2 text-body text-text-muted">
            Visual baselines for the admin shell header. Default (no unread)
            and with-unread dot on the notifications bell.
          </p>
        </header>

        <section aria-labelledby="topbar-default-heading" className="space-y-3">
          <h2
            id="topbar-default-heading"
            className="text-caption font-semibold uppercase tracking-wider text-text-muted"
          >
            Default
          </h2>
          <div
            data-testid="topbar-default-frame"
            className="overflow-hidden rounded-card border border-border"
          >
            <AdminTopBar
              userName="Nino Kapanadze"
              userEmail="nino@cafelinville.ge"
              userPlan="STARTER"
              hasUnreadNotifications={false}
              crumbs={[
                { label: 'Dashboard', href: '/admin/dashboard' },
                { label: 'Menus' },
              ]}
            />
          </div>
        </section>

        <section aria-labelledby="topbar-unread-heading" className="space-y-3">
          <h2
            id="topbar-unread-heading"
            className="text-caption font-semibold uppercase tracking-wider text-text-muted"
          >
            With unread notifications
          </h2>
          <div
            data-testid="topbar-unread-frame"
            className="overflow-hidden rounded-card border border-border"
          >
            <AdminTopBar
              userName="Nino Kapanadze"
              userEmail="nino@cafelinville.ge"
              userPlan="STARTER"
              hasUnreadNotifications
              crumbs={[
                { label: 'Dashboard', href: '/admin/dashboard' },
                { label: 'Menus', href: '/admin/menus' },
                { label: 'Main menu' },
              ]}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
