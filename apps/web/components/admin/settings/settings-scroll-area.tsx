'use client';

import { useSettingsForm } from './settings-form-context';

interface SettingsScrollAreaProps {
  children: React.ReactNode;
}

export function SettingsScrollArea({ children }: SettingsScrollAreaProps) {
  const { isDirty } = useSettingsForm();

  return (
    <div
      data-testid="settings-content"
      className={`flex-1 px-4 py-6 md:overflow-y-auto md:px-8 md:py-8 ${
        isDirty ? 'pb-40 md:pb-8' : 'pb-24 md:pb-8'
      }`}
    >
      <div className="mx-auto max-w-[720px]">{children}</div>
    </div>
  );
}
