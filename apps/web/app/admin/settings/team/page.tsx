import { getTranslations } from 'next-intl/server';

import { auth } from '@/lib/auth/auth';
import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { TeamLocked } from '@/components/admin/settings/team-locked';

export default async function SettingsTeamPage() {
  const session = await auth();
  const t = await getTranslations('admin.settings.tabs.team');

  // Team is locked for all plans until backend ships (T16.5 scope).
  const showLocked = true;

  return (
    <div data-testid="settings-tab-team">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      {showLocked ? <TeamLocked /> : null}
    </div>
  );
}
