import Link from 'next/link';
import { ExternalLink, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';

export interface WelcomeHeaderProps {
  /** First name used for personalised greeting. Falls back to "there" if empty. */
  firstName?: string | null;
  /**
   * Slug of the user's most-recent menu. When provided, "View public menu"
   * links to `/m/{slug}`. When absent, the button renders disabled so it
   * still anchors the layout.
   */
  publicMenuSlug?: string | null;
  /**
   * Optional clock override for deterministic greetings in tests.
   * Production leaves this undefined and uses server-local time.
   */
  now?: Date;
}

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export async function WelcomeHeader({
  firstName,
  publicMenuSlug,
  now,
}: WelcomeHeaderProps) {
  const t = await getTranslations('admin.dashboard.welcome');

  const hour = (now ?? new Date()).getHours();
  const greeting = t(greetingKey(hour), {
    name: firstName?.split(' ')[0] ?? t('fallbackName'),
  });

  return (
    <div
      data-testid="dashboard-welcome"
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div className="min-w-0">
        <h1
          data-testid="dashboard-greeting"
          className="text-[26px] font-semibold tracking-[-0.5px] leading-[1.15] text-text-default"
        >
          {greeting} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">{t('subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {publicMenuSlug ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            data-testid="dashboard-view-public"
          >
            <Link
              href={`/m/${publicMenuSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink strokeWidth={1.5} />
              {t('viewPublic')}
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            leadingIcon={ExternalLink}
            data-testid="dashboard-view-public"
          >
            {t('viewPublic')}
          </Button>
        )}

        <Button asChild size="sm" data-testid="dashboard-create-menu">
          <Link href="/admin/menus/new">
            <Plus strokeWidth={2} />
            {t('createMenu')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
