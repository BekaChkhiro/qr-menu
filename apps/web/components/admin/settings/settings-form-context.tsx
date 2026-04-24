'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type SettingsFormContextValue = {
  isDirty: boolean;
  markDirty: () => void;
  markClean: () => void;
};

const SettingsFormContext = createContext<SettingsFormContextValue | null>(null);

export function SettingsFormProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  const value = useMemo(
    () => ({ isDirty, markDirty, markClean }),
    [isDirty, markDirty, markClean],
  );

  return (
    <SettingsFormContext.Provider value={value}>{children}</SettingsFormContext.Provider>
  );
}

export function useSettingsForm(): SettingsFormContextValue {
  const ctx = useContext(SettingsFormContext);
  if (!ctx) {
    throw new Error('useSettingsForm must be used inside <SettingsFormProvider>');
  }
  return ctx;
}
