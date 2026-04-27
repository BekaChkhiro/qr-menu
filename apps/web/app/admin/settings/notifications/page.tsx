import { getTranslations } from 'next-intl/server';

import { NotificationsForm } from '@/components/admin/settings/notifications-form';
import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';

export default async function SettingsNotificationsPage() {
  const t = await getTranslations('admin.settings.tabs.notifications');

  return (
    <div data-testid="settings-tab-notifications">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <NotificationsForm />
    </div>
  );
}
