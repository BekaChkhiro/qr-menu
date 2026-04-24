import { getTranslations } from 'next-intl/server';

import { ProfileForm } from '@/components/admin/settings/profile-form';
import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';

export default async function SettingsProfilePage() {
  const t = await getTranslations('admin.settings.tabs.profile');

  return (
    <div data-testid="settings-tab-profile">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <ProfileForm />
    </div>
  );
}
