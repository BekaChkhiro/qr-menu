import { getTranslations } from 'next-intl/server';

import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { BusinessForm } from '@/components/admin/settings/business-form';

export default async function SettingsBusinessInfoPage() {
  const t = await getTranslations('admin.settings.tabs.businessInfo');

  return (
    <div data-testid="settings-tab-business-info">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <BusinessForm />
    </div>
  );
}
