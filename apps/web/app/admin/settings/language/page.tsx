import { getTranslations } from 'next-intl/server';

import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { SettingsPlaceholderCard } from '@/components/admin/settings/settings-placeholder-card';

export default async function SettingsLanguagePage() {
  const t = await getTranslations('admin.settings.tabs.language');

  return (
    <div data-testid="settings-tab-language">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <SettingsPlaceholderCard tabKey="language" />
    </div>
  );
}
