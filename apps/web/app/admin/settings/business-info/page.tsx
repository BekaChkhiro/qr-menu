import { getTranslations } from 'next-intl/server';

import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { SettingsPlaceholderCard } from '@/components/admin/settings/settings-placeholder-card';

export default async function SettingsBusinessInfoPage() {
  const t = await getTranslations('admin.settings.tabs.businessInfo');

  return (
    <div data-testid="settings-tab-business-info">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <SettingsPlaceholderCard tabKey="business-info" />
    </div>
  );
}
