import { getTranslations } from 'next-intl/server';

import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { SettingsPlaceholderCard } from '@/components/admin/settings/settings-placeholder-card';

export default async function SettingsBillingPage() {
  const t = await getTranslations('admin.settings.tabs.billing');

  return (
    <div data-testid="settings-tab-billing">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <SettingsPlaceholderCard tabKey="billing" />
    </div>
  );
}
