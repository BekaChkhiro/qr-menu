import { getTranslations } from 'next-intl/server';

import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { SecurityForm } from '@/components/admin/settings/security-form';

export default async function SettingsSecurityPage() {
  const t = await getTranslations('admin.settings.tabs.security');

  return (
    <div data-testid="settings-tab-security">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <SecurityForm />
    </div>
  );
}
