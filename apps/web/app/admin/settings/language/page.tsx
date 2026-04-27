import { getTranslations } from 'next-intl/server';

import { LanguageForm } from '@/components/admin/settings/language-form';
import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';

export default async function SettingsLanguagePage() {
  const t = await getTranslations('admin.settings.tabs.language');

  return (
    <div data-testid="settings-tab-language">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />
      <LanguageForm />
    </div>
  );
}
