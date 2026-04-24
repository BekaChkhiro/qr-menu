import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth/auth';
import { SettingsFormProvider } from '@/components/admin/settings/settings-form-context';
import { SettingsNavRail } from '@/components/admin/settings/settings-nav-rail';
import { SettingsSaveBar } from '@/components/admin/settings/settings-save-bar';

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
        className="-m-6 flex h-[calc(100%+3rem)] overflow-hidden"
      >
        <SettingsNavRail plan={plan} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            data-testid="settings-content"
            className="flex-1 overflow-y-auto px-8 py-8"
          >
            <div className="mx-auto max-w-[720px]">{children}</div>
          </div>
          <SettingsSaveBar />
        </div>
      </div>
    </SettingsFormProvider>
  );
}
