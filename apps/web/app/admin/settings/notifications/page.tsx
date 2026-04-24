import { getTranslations } from 'next-intl/server';

import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { SettingsPlaceholderCard } from '@/components/admin/settings/settings-placeholder-card';

export default async function SettingsNotificationsPage() {
  const t = await getTranslations('admin.settings.tabs.notifications');

  return (
    <div data-testid="settings-tab-notifications">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <SettingsPlaceholderCard tabKey="notifications" />
    </div>
  );
}
