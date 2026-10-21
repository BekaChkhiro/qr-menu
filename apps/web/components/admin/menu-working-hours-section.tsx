'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Coffee, Loader2, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TimeInput } from '@/components/admin/time-input';
import { useUpdateMenu } from '@/hooks/use-menus';
import {
  defaultWorkingHours,
  hasWorkingHours,
  normalizeWorkingHours,
  type WeekdayKey,
  type WorkingHoursDay,
} from '@/lib/menu/working-hours';
import { cn } from '@/lib/utils';
import type { MenuWithDetails } from '@/types/menu';

// T24.4 — the venue's opening / closing hours, with an optional mid-day break.
// Two things read this: the public menu footer, and the promotion / dish
// "limit rules" editor, which pre-fills its day windows from these hours.

interface MenuWorkingHoursSectionProps {
  menu: MenuWithDetails;
}

const DEFAULT_BREAK = { breakStart: '15:00', breakEnd: '17:00' };

function serialize(hours: WorkingHoursDay[]): string {
  return JSON.stringify(hours);
}

export function MenuWorkingHoursSection({ menu }: MenuWorkingHoursSectionProps) {
  const t = useTranslations('admin.editor.settings.workingHours');
  const updateMenu = useUpdateMenu(menu.id);

  const stored = useMemo(() => normalizeWorkingHours(menu.workingHours), [menu.workingHours]);
  // The show switch only decides whether the footer prints the hours. The hours
  // themselves are always kept, because promotion windows pre-fill from them.
  // `showWorkingHours` null = a row saved before the flag existed: follow the hours.
  const storedShow = menu.showWorkingHours ?? hasWorkingHours(stored);
  const [enabled, setEnabled] = useState(storedShow);
  const [hours, setHours] = useState<WorkingHoursDay[]>(stored ?? defaultWorkingHours());

  const syncKey = `${stored ? serialize(stored) : ''}|${storedShow}`;
  const lastSyncedRef = useRef(syncKey);

  useEffect(() => {
    if (syncKey === lastSyncedRef.current) return;
    lastSyncedRef.current = syncKey;
    setEnabled(storedShow);
    setHours(stored ?? defaultWorkingHours());
  }, [syncKey, stored, storedShow]);

  const patchDay = (day: WeekdayKey, patch: Partial<WorkingHoursDay>) => {
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  };

  const initialSerialized = serialize(stored ?? defaultWorkingHours());
  const dirty = enabled !== storedShow || serialize(hours) !== initialSerialized;

  const handleDiscard = () => {
    setEnabled(storedShow);
    setHours(stored ?? defaultWorkingHours());
  };

  const handleSave = async () => {
    try {
      await updateMenu.mutateAsync({ workingHours: hours, showWorkingHours: enabled });
      toast.success(t('saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const saving = updateMenu.isPending;

  return (
    <section
      data-testid="settings-working-hours"
      data-enabled={enabled ? 'true' : 'false'}
      data-dirty={dirty ? 'true' : 'false'}
      className="flex flex-col gap-4"
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-[12px] border p-3',
          enabled ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]' : 'border-border',
        )}
      >
        <div className="flex-1">
          <div className="text-[13px] font-medium text-text-default">{t('toggleTitle')}</div>
          <div className="text-[11.5px] leading-[1.45] text-text-muted">{t('toggleHint')}</div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          data-testid="settings-working-hours-toggle"
        />
      </div>

      <>
        <div className="flex flex-col gap-2">
          {hours.map((h) => {
            const hasBreak = !!(h.breakStart && h.breakEnd);
            return (
              <div
                key={h.day}
                data-testid={`settings-working-hours-row-${h.day}`}
                data-closed={h.closed ? 'true' : 'false'}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border p-2.5',
                  h.closed ? 'border-border bg-bg' : 'border-success bg-card',
                )}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="w-[42px] shrink-0 text-[12px] font-semibold uppercase tracking-[0.4px] text-text-default">
                    {t(`days.${h.day}`)}
                  </span>
                  <Switch
                    checked={!h.closed}
                    onCheckedChange={(open) => patchDay(h.day, { closed: !open })}
                    aria-label={t('openAriaLabel', { day: t(`days.${h.day}`) })}
                    data-testid={`settings-working-hours-open-${h.day}`}
                  />
                  {h.closed ? (
                    <span className="text-[12px] text-text-muted">{t('closed')}</span>
                  ) : (
                    <>
                      <TimeInput
                        value={h.open}
                        onChange={(open) => patchDay(h.day, { open })}
                        testId={`settings-working-hours-from-${h.day}`}
                        ariaLabel={`${h.day} open`}
                      />
                      <span className="text-[12px] text-text-muted">{t('to')}</span>
                      <TimeInput
                        value={h.close}
                        onChange={(close) => patchDay(h.day, { close })}
                        testId={`settings-working-hours-until-${h.day}`}
                        ariaLabel={`${h.day} close`}
                      />
                      {!hasBreak && (
                        <button
                          type="button"
                          onClick={() => patchDay(h.day, DEFAULT_BREAK)}
                          data-testid={`settings-working-hours-add-break-${h.day}`}
                          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:bg-chip"
                        >
                          <Coffee className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                          {t('addBreak')}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {!h.closed && hasBreak && (
                  <div
                    className="flex flex-wrap items-center gap-2 pl-[52px]"
                    data-testid={`settings-working-hours-break-${h.day}`}
                  >
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-text-muted">
                      <Coffee className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                      {t('breakLabel')}
                    </span>
                    <TimeInput
                      value={h.breakStart!}
                      onChange={(breakStart) => patchDay(h.day, { breakStart })}
                      testId={`settings-working-hours-break-start-${h.day}`}
                      ariaLabel={`${h.day} break start`}
                    />
                    <span className="text-[12px] text-text-muted">{t('to')}</span>
                    <TimeInput
                      value={h.breakEnd!}
                      onChange={(breakEnd) => patchDay(h.day, { breakEnd })}
                      testId={`settings-working-hours-break-end-${h.day}`}
                      ariaLabel={`${h.day} break end`}
                    />
                    <button
                      type="button"
                      onClick={() => patchDay(h.day, { breakStart: null, breakEnd: null })}
                      data-testid={`settings-working-hours-remove-break-${h.day}`}
                      aria-label={t('removeBreak')}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-chip hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>

      {dirty && (
        <div className="flex items-center justify-end gap-2 border-t border-border-soft pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            data-testid="settings-working-hours-discard"
          >
            {t('discard')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="settings-working-hours-save"
          >
            {saving && (
              <Loader2 size={14} strokeWidth={2} className="mr-1 animate-spin" aria-hidden="true" />
            )}
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      )}
    </section>
  );
}
