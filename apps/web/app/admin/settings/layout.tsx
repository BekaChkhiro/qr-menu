import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { SettingsFormProvider } from '@/components/admin/settings/settings-form-context';
import { SettingsMobileAccordion, SettingsNavRail } from '@/components/admin/settings/settings-nav-rail';
import { SettingsSaveBar } from '@/components/admin/settings/settings-save-bar';
import { SettingsScrollArea } from '@/components/admin/settings/settings-scroll-area';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const plan = session.user?.plan ?? 'FREE';

  return (
    <SettingsFormProvider>
      <div
        data-testid="settings-shell"
        className="flex flex-col md:-m-6 md:h-[calc(100%+3rem)] md:flex-row md:overflow-hidden"
      >
        <SettingsNavRail plan={plan} />
        <SettingsMobileAccordion plan={plan} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SettingsScrollArea>{children}</SettingsScrollArea>
          <SettingsSaveBar />
        </div>
      </div>
    </SettingsFormProvider>
  );
}
