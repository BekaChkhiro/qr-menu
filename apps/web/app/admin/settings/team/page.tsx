import { getTranslations } from 'next-intl/server';

import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { SettingsPlaceholderCard } from '@/components/admin/settings/settings-placeholder-card';

export default async function SettingsTeamPage() {
  const t = await getTranslations('admin.settings.tabs.team');

  return (
    <div data-testid="settings-tab-team">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <SettingsPlaceholderCard tabKey="team" />
    </div>
  );
}
