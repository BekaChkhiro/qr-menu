'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useUpdateMenu } from '@/hooks/use-menus';
import type { MenuWithDetails } from '@/types/menu';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDateTimeLocalInput(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  // datetime-local expects YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateTimeLocalInput(value: string): string | null {
  if (!value) return null;
  // Parse as local time, then convert to ISO
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

interface ToggleCardProps {
  title: string;
  body: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: React.ReactNode;
  'data-testid'?: string;
}

function ToggleCard({ title, body, enabled, onToggle, children, 'data-testid': testId }: ToggleCardProps) {
  return (
    <div
      data-testid={testId}
      data-enabled={enabled ? 'true' : 'false'}
      className={cn(
        'rounded-[10px] border bg-card px-4 py-[14px] transition-colors',
        enabled ? 'border-text-default shadow-[0_0_0_1px_hsl(var(--text-default))]' : 'border-border'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-text-default">{title}</div>
          <div className="mt-[2px] text-[12px] text-text-muted">{body}</div>
          {enabled && children && <div className="mt-[10px]">{children}</div>}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          data-testid={`${testId}-switch`}
          aria-label={title}
        />
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────

interface ScheduleSectionProps {
  menu: MenuWithDetails;
}

export function ScheduleSection({ menu }: ScheduleSectionProps) {
  const t = useTranslations('admin.editor.settings.schedule');
  const updateMenu = useUpdateMenu(menu.id);

  const initialPublishAt = menu.scheduledPublishAt;
  const initialUnpublishAt = menu.scheduledUnpublishAt;

  const [publishEnabled, setPublishEnabled] = useState(Boolean(initialPublishAt));
  const [unpublishEnabled, setUnpublishEnabled] = useState(Boolean(initialUnpublishAt));
  const [publishAt, setPublishAt] = useState(formatDateTimeLocalInput(initialPublishAt));
  const [unpublishAt, setUnpublishAt] = useState(formatDateTimeLocalInput(initialUnpublishAt));

  // Sync when menu refetches
  const lastSyncedRef = useRef({ publishAt: initialPublishAt, unpublishAt: initialUnpublishAt });
  useEffect(() => {
    if (
      lastSyncedRef.current.publishAt !== menu.scheduledPublishAt ||
      lastSyncedRef.current.unpublishAt !== menu.scheduledUnpublishAt
    ) {
      setPublishEnabled(Boolean(menu.scheduledPublishAt));
      setUnpublishEnabled(Boolean(menu.scheduledUnpublishAt));
      setPublishAt(formatDateTimeLocalInput(menu.scheduledPublishAt));
      setUnpublishAt(formatDateTimeLocalInput(menu.scheduledUnpublishAt));
      lastSyncedRef.current = {
        publishAt: menu.scheduledPublishAt,
        unpublishAt: menu.scheduledUnpublishAt,
      };
    }
  }, [menu.scheduledPublishAt, menu.scheduledUnpublishAt]);

  const dirty = useMemo(() => {
    const publishDirty = publishEnabled !== Boolean(initialPublishAt) ||
      (publishEnabled && publishAt !== formatDateTimeLocalInput(initialPublishAt));
    const unpublishDirty = unpublishEnabled !== Boolean(initialUnpublishAt) ||
      (unpublishEnabled && unpublishAt !== formatDateTimeLocalInput(initialUnpublishAt));
    return publishDirty || unpublishDirty;
  }, [publishEnabled, unpublishEnabled, publishAt, unpublishAt, initialPublishAt, initialUnpublishAt]);

  const handleDiscard = () => {
    setPublishEnabled(Boolean(initialPublishAt));
    setUnpublishEnabled(Boolean(initialUnpublishAt));
    setPublishAt(formatDateTimeLocalInput(initialPublishAt));
    setUnpublishAt(formatDateTimeLocalInput(initialUnpublishAt));
  };

  const handleSave = async () => {
    const payload: Record<string, unknown> = {};

    if (publishEnabled && publishAt) {
      const parsed = parseDateTimeLocalInput(publishAt);
      if (parsed) payload.scheduledPublishAt = parsed;
    } else if (!publishEnabled && initialPublishAt) {
      payload.scheduledPublishAt = null;
    }

    if (unpublishEnabled && unpublishAt) {
      const parsed = parseDateTimeLocalInput(unpublishAt);
      if (parsed) payload.scheduledUnpublishAt = parsed;
    } else if (!unpublishEnabled && initialUnpublishAt) {
      payload.scheduledUnpublishAt = null;
    }

    try {
      await updateMenu.mutateAsync(payload);
      toast.success(t('saved'));
      lastSyncedRef.current = {
        publishAt: payload.scheduledPublishAt as string | null ?? null,
        unpublishAt: payload.scheduledUnpublishAt as string | null ?? null,
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveFailed'));
    }
  };

  const saving = updateMenu.isPending;

  return (
    <section
      data-testid="settings-schedule"
      data-dirty={dirty ? 'true' : 'false'}
      className="flex flex-col gap-3"
    >
      <ToggleCard
        title={t('autoPublishTitle')}
        body={t('autoPublishBody')}
        enabled={publishEnabled}
        onToggle={setPublishEnabled}
        data-testid="settings-schedule-publish"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
              className="absolute left-[10px] top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              data-testid="settings-schedule-publish-date"
              className="h-[36px] w-full rounded-[8px] border border-border bg-card pl-[30px] pr-[10px] text-[13px] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
            />
          </div>
        </div>
      </ToggleCard>

      <ToggleCard
        title={t('autoUnpublishTitle')}
        body={t('autoUnpublishBody')}
        enabled={unpublishEnabled}
        onToggle={setUnpublishEnabled}
        data-testid="settings-schedule-unpublish"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
              className="absolute left-[10px] top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="datetime-local"
              value={unpublishAt}
              onChange={(e) => setUnpublishAt(e.target.value)}
              data-testid="settings-schedule-unpublish-date"
              className="h-[36px] w-full rounded-[8px] border border-border bg-card pl-[30px] pr-[10px] text-[13px] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
            />
          </div>
        </div>
      </ToggleCard>

      {dirty && (
        <div className="flex items-center justify-end gap-2 border-t border-border-soft pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            data-testid="settings-schedule-discard"
          >
            {t('discard')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="settings-schedule-save"
          >
            {saving && (
              <Loader2
                size={14}
                strokeWidth={2}
                className="mr-1 animate-spin"
                aria-hidden="true"
              />
            )}
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      )}
    </section>
  );
}
