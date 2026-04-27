'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Mail, Smartphone } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  useNotifications,
  useUpdateNotifications,
  type NotificationPreferences,
} from '@/hooks/use-notifications';
import { useSettingsForm } from './settings-form-context';

type NotifKey =
  | 'menuEditEmail'
  | 'menuEditPush'
  | 'outOfStockEmail'
  | 'outOfStockPush'
  | 'weeklyDigestEmail'
  | 'weeklyDigestPush'
  | 'invoiceReadyEmail'
  | 'invoiceReadyPush'
  | 'paymentFailedEmail'
  | 'paymentFailedPush'
  | 'newSignInEmail'
  | 'newSignInPush';

interface FormState {
  email: string;
  menuEditEmail: boolean;
  menuEditPush: boolean;
  outOfStockEmail: boolean;
  outOfStockPush: boolean;
  weeklyDigestEmail: boolean;
  weeklyDigestPush: boolean;
  invoiceReadyEmail: boolean;
  invoiceReadyPush: boolean;
  paymentFailedEmail: boolean;
  paymentFailedPush: boolean;
  newSignInEmail: boolean;
  newSignInPush: boolean;
}

function toFormState(prefs: NotificationPreferences | undefined | null): FormState {
  return {
    email: prefs?.email ?? '',
    menuEditEmail: prefs?.menuEditEmail ?? true,
    menuEditPush: prefs?.menuEditPush ?? false,
    outOfStockEmail: prefs?.outOfStockEmail ?? false,
    outOfStockPush: prefs?.outOfStockPush ?? true,
    weeklyDigestEmail: prefs?.weeklyDigestEmail ?? true,
    weeklyDigestPush: prefs?.weeklyDigestPush ?? false,
    invoiceReadyEmail: prefs?.invoiceReadyEmail ?? true,
    invoiceReadyPush: prefs?.invoiceReadyPush ?? false,
    paymentFailedEmail: prefs?.paymentFailedEmail ?? true,
    paymentFailedPush: prefs?.paymentFailedPush ?? true,
    newSignInEmail: prefs?.newSignInEmail ?? true,
    newSignInPush: prefs?.newSignInPush ?? true,
  };
}

function diffPayload(initial: FormState, current: FormState): Partial<FormState> {
  const payload: Partial<FormState> = {};
  (Object.keys(current) as NotifKey[]).forEach((key) => {
    if (current[key] !== initial[key]) {
      (payload as Record<NotifKey, boolean | string>)[key] = current[key];
    }
  });
  if (current.email.trim() !== initial.email.trim()) {
    payload.email = current.email.trim();
  }
  return payload;
}

type NotifPrefix = 'menuEdit' | 'outOfStock' | 'weeklyDigest' | 'invoiceReady' | 'paymentFailed' | 'newSignIn';

interface NotifRowDef {
  prefix: NotifPrefix;
  locked?: boolean;
}

const MENU_ACTIVITY_ROWS: NotifRowDef[] = [
  { prefix: 'menuEdit' },
  { prefix: 'outOfStock' },
  { prefix: 'weeklyDigest' },
] as const;

const BILLING_ROWS: NotifRowDef[] = [
  { prefix: 'invoiceReady' },
  { prefix: 'paymentFailed', locked: true },
  { prefix: 'newSignIn' },
] as const;

export function NotificationsForm() {
  const t = useTranslations('admin.settings.notifications');
  const tCommon = useTranslations('admin.settings');
  const { data: prefs, isLoading } = useNotifications();
  const updateNotifications = useUpdateNotifications();
  const { markDirty, markClean } = useSettingsForm();

  const [initial, setInitial] = useState<FormState>(() => toFormState(prefs));
  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    if (prefs) {
      const next = toFormState(prefs);
      setInitial(next);
      setForm(next);
    }
  }, [prefs]);

  const dirtyPayload = useMemo(() => diffPayload(initial, form), [initial, form]);
  const isDirty = Object.keys(dirtyPayload).length > 0;

  useEffect(() => {
    if (isDirty) markDirty();
    else markClean();
  }, [isDirty, markDirty, markClean]);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const handleDiscard = useCallback(() => {
    setForm(initial);
  }, [initial]);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    try {
      const updated = await updateNotifications.mutateAsync(dirtyPayload);
      const next = toFormState(updated);
      setInitial(next);
      setForm(next);
      markClean();
      toast.success(t('toast.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed'));
    }
  }, [dirtyPayload, isDirty, markClean, t, updateNotifications]);

  const isBusy = updateNotifications.isPending;

  if (isLoading && !prefs) {
    return (
      <div
        data-testid="settings-notifications-loading"
        className="rounded-card border border-border bg-card p-8 text-center text-text-muted"
      >
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <form
      data-testid="settings-notifications-form"
      data-dirty={isDirty ? 'true' : 'false'}
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="space-y-7"
    >
      {/* Delivery channels */}
      <FormSection label={t('sections.delivery')}>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <LabeledField label={t('fields.email')} htmlFor="notif-email">
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-text-muted"
                strokeWidth={1.5}
              />
              <Input
                id="notif-email"
                data-testid="notif-email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="pl-8"
                disabled={isBusy}
              />
            </div>
          </LabeledField>

          <LabeledField label={t('fields.push')} hint={t('fields.pushHint')}>
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-[9px]">
              <Smartphone
                className="h-[13px] w-[13px] text-text-muted"
                strokeWidth={1.5}
              />
              <span className="flex-1 text-[13px] text-text-default">
                {t('fields.pushDevice')}
              </span>
              <span className="text-[11.5px] font-semibold text-success">
                {t('fields.pushPaired')}
              </span>
            </div>
          </LabeledField>
        </div>
      </FormSection>

      {/* Menu activity */}
      <FormSection label={t('sections.menuActivity')}>
        <NotifCard>
          <NotifHeader emailLabel={t('columns.email')} pushLabel={t('columns.push')} />
          {MENU_ACTIVITY_ROWS.map((row) => (
            <NotifRow
              key={row.prefix}
              title={t(`items.${row.prefix}.title`)}
              hint={t(`items.${row.prefix}.hint`)}
              emailChecked={form[`${row.prefix}Email` as NotifKey]}
              pushChecked={form[`${row.prefix}Push` as NotifKey]}
              onEmailChange={(v) => updateField(`${row.prefix}Email` as NotifKey, v)}
              onPushChange={(v) => updateField(`${row.prefix}Push` as NotifKey, v)}
              disabled={isBusy}
              testidPrefix={`notif-${row.prefix}`}
            />
          ))}
        </NotifCard>
      </FormSection>

      {/* Billing & account */}
      <FormSection label={t('sections.billing')}>
        <NotifCard>
          <NotifHeader emailLabel={t('columns.email')} pushLabel={t('columns.push')} />
          {BILLING_ROWS.map((row) => (
            <NotifRow
              key={row.prefix}
              title={t(`items.${row.prefix}.title`)}
              hint={t(`items.${row.prefix}.hint`)}
              emailChecked={form[`${row.prefix}Email` as NotifKey]}
              pushChecked={form[`${row.prefix}Push` as NotifKey]}
              onEmailChange={(v) => updateField(`${row.prefix}Email` as NotifKey, v)}
              onPushChange={(v) => updateField(`${row.prefix}Push` as NotifKey, v)}
              disabled={isBusy || row.locked}
              testidPrefix={`notif-${row.prefix}`}
            />
          ))}
        </NotifCard>
      </FormSection>

      {/* Inline action row */}
      {isDirty && (
        <div
          data-testid="notifications-form-actions"
          className="flex items-center justify-end gap-2 pt-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={isBusy}
            data-testid="notifications-discard"
          >
            {tCommon('saveBar.discard')}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isBusy}
            data-testid="notifications-save"
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-1.5 h-[13px] w-[13px] animate-spin" />
                {t('toast.saving')}
              </>
            ) : (
              tCommon('saveBar.save')
            )}
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Layout helpers ───────────────────────────────────────────────────────────

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3.5">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
        {label}
      </h3>
      {children}
    </section>
  );
}

function LabeledField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[12.5px] font-semibold text-text-default"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11.5px] leading-[1.4] text-text-muted">{hint}</p>
      )}
    </div>
  );
}

function NotifCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card">
      {children}
    </div>
  );
}

function NotifHeader({ emailLabel, pushLabel }: { emailLabel: string; pushLabel: string }) {
  return (
    <div
      data-testid="notif-card-header"
      className="grid grid-cols-[1fr_70px_70px] items-center gap-5 border-b border-border px-[18px] py-3"
    >
      <span />
      <span className="text-center text-[10.5px] font-bold uppercase tracking-[0.6px] text-text-subtle">
        {emailLabel}
      </span>
      <span className="text-center text-[10.5px] font-bold uppercase tracking-[0.6px] text-text-subtle">
        {pushLabel}
      </span>
    </div>
  );
}

function NotifRow({
  title,
  hint,
  emailChecked,
  pushChecked,
  onEmailChange,
  onPushChange,
  disabled,
  testidPrefix,
}: {
  title: string;
  hint: string;
  emailChecked: boolean;
  pushChecked: boolean;
  onEmailChange: (v: boolean) => void;
  onPushChange: (v: boolean) => void;
  disabled?: boolean;
  testidPrefix: string;
}) {
  return (
    <div
      data-testid={`${testidPrefix}-row`}
      className="grid grid-cols-[1fr_70px_70px] items-center gap-5 border-b border-border/60 px-[18px] py-3.5 last:border-b-0"
    >
      <div>
        <div className="text-[13px] font-medium text-text-default">{title}</div>
        <div className="mt-0.5 text-[12px] leading-[1.4] text-text-muted">
          {hint}
        </div>
      </div>
      <div className="flex justify-center">
        <Switch
          data-testid={`${testidPrefix}-email`}
          checked={emailChecked}
          onCheckedChange={onEmailChange}
          disabled={disabled}
          aria-label={`${title} — email`}
        />
      </div>
      <div className="flex justify-center">
        <Switch
          data-testid={`${testidPrefix}-push`}
          checked={pushChecked}
          onCheckedChange={onPushChange}
          disabled={disabled}
          aria-label={`${title} — push`}
        />
      </div>
    </div>
  );
}
