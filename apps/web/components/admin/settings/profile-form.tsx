'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Camera, CheckCircle2, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpload } from '@/hooks/use-upload';
import { useProfile, useUpdateProfile, type UserProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

import { useSettingsForm } from './settings-form-context';

type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

const DATE_FORMATS: DateFormat[] = ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

// IANA timezone id -> user-facing label. Kept small on purpose — the main
// targets are Georgia + common nearby offsets. Can be extended without touching
// the API contract.
const TIMEZONE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'Asia/Tbilisi', labelKey: 'tbilisi' },
  { value: 'Europe/Istanbul', labelKey: 'istanbul' },
  { value: 'Europe/Moscow', labelKey: 'moscow' },
  { value: 'Europe/Kiev', labelKey: 'kyiv' },
  { value: 'Europe/London', labelKey: 'london' },
  { value: 'Europe/Berlin', labelKey: 'berlin' },
  { value: 'America/New_York', labelKey: 'newYork' },
  { value: 'America/Los_Angeles', labelKey: 'losAngeles' },
  { value: 'UTC', labelKey: 'utc' },
];

function initialsFrom(name: string | null | undefined, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    const letters = parts
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('');
    if (letters) return letters.toUpperCase();
  }
  if (email) return email[0]?.toUpperCase() ?? 'U';
  return 'U';
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  timezone: string;
  dateFormat: DateFormat;
  image: string | null;
}

function toFormState(user: UserProfile | undefined | null): FormState {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    timezone: user?.timezone ?? 'Asia/Tbilisi',
    dateFormat: (user?.dateFormat as DateFormat) ?? 'DD.MM.YYYY',
    image: user?.image ?? null,
  };
}

function diffPayload(initial: FormState, current: FormState) {
  const payload: Record<string, string | null> = {};
  if (current.firstName.trim() !== initial.firstName.trim())
    payload.firstName = current.firstName.trim();
  if (current.lastName.trim() !== initial.lastName.trim())
    payload.lastName = current.lastName.trim();
  if (current.phone.trim() !== initial.phone.trim()) payload.phone = current.phone.trim();
  if (current.timezone !== initial.timezone) payload.timezone = current.timezone;
  if (current.dateFormat !== initial.dateFormat) payload.dateFormat = current.dateFormat;
  if ((current.image ?? '') !== (initial.image ?? '')) payload.image = current.image ?? '';
  return payload;
}

export function ProfileForm() {
  const t = useTranslations('admin.settings.profile');
  const tCommon = useTranslations('admin.settings');
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { update: updateSession } = useSession();
  const { markDirty, markClean } = useSettingsForm();

  const [initial, setInitial] = useState<FormState>(() => toFormState(profile));
  const [form, setForm] = useState<FormState>(initial);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { upload, isUploading } = useUpload({
    onSuccess: ({ url }) => {
      setForm((f) => ({ ...f, image: url }));
      setAvatarError(null);
    },
    onError: (err) => {
      setAvatarError(err.message);
    },
  });

  // Hydrate form state when the profile loads / refreshes.
  useEffect(() => {
    if (profile) {
      const next = toFormState(profile);
      setInitial(next);
      setForm(next);
    }
  }, [profile]);

  const dirtyPayload = useMemo(() => diffPayload(initial, form), [initial, form]);
  const isDirty = Object.keys(dirtyPayload).length > 0;

  useEffect(() => {
    if (isDirty) markDirty();
    else markClean();
  }, [isDirty, markDirty, markClean]);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
    },
    []
  );

  const handleAvatarPick = useCallback(
    (file: File) => {
      upload({ file, options: { preset: 'logo', folder: 'digital-menu/avatars' } });
    },
    [upload]
  );

  const handleAvatarRemove = useCallback(() => {
    setForm((f) => ({ ...f, image: null }));
    setAvatarError(null);
  }, []);

  const handleDiscard = useCallback(() => {
    setForm(initial);
    setAvatarError(null);
  }, [initial]);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    try {
      const updated = await updateProfile.mutateAsync(dirtyPayload);
      const next: FormState = {
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
        phone: updated.phone ?? '',
        timezone: updated.timezone ?? 'Asia/Tbilisi',
        dateFormat: (updated.dateFormat as DateFormat) ?? 'DD.MM.YYYY',
        image: updated.image ?? null,
      };
      setInitial(next);
      setForm(next);
      markClean();

      // Refresh the JWT so the top bar / other UI picks up new name + avatar.
      await updateSession({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        timezone: updated.timezone,
        dateFormat: updated.dateFormat,
        image: updated.image,
        name: updated.name,
      });

      toast.success(t('toast.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed'));
    }
  }, [dirtyPayload, isDirty, markClean, t, updateProfile, updateSession]);

  const initials = initialsFrom(
    [form.firstName, form.lastName].filter(Boolean).join(' ') || profile?.name,
    profile?.email
  );
  const isBusy = updateProfile.isPending || isUploading;

  if (isLoading && !profile) {
    return (
      <div
        data-testid="settings-profile-loading"
        className="rounded-card border border-border bg-card p-8 text-center text-text-muted"
      >
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <form
      data-testid="settings-profile-form"
      data-dirty={isDirty ? 'true' : 'false'}
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="space-y-7"
    >
      {/* Avatar block */}
      <div
        data-testid="profile-avatar-block"
        className="flex items-center gap-[18px] rounded-card border border-border bg-[#FCFBF8] p-[18px]"
      >
        <div className="relative h-[68px] w-[68px] flex-shrink-0">
          <div
            data-testid="profile-avatar"
            className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full text-[26px] font-semibold tracking-[-0.5px] text-white"
            style={{
              background: form.image
                ? undefined
                : 'linear-gradient(135deg, #D4A574 0%, #B8864C 100%)',
            }}
          >
            {form.image ? (
              <Image
                src={form.image}
                alt={initials}
                width={68}
                height={68}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            aria-label={t('avatar.pick')}
            onClick={() => avatarInputRef.current?.click()}
            disabled={isBusy}
            data-testid="profile-avatar-camera"
            className="absolute -bottom-[2px] -right-[2px] flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] hover:bg-chip disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-[12.5px] w-[12.5px] animate-spin text-text-default" />
            ) : (
              <Camera className="h-[12.5px] w-[12.5px] text-text-default" />
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleAvatarPick(file);
              event.target.value = '';
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-text-default" data-testid="profile-display-name">
            {[form.firstName, form.lastName].filter(Boolean).join(' ') ||
              profile?.name ||
              t('avatar.unnamed')}
          </div>
          <div className="mt-0.5 text-[12.5px] text-text-muted">
            {profile?.email} · {t('avatar.roleOwner')}
          </div>
          <div className="mt-2.5 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isBusy}
              data-testid="profile-avatar-upload"
            >
              <Upload className="mr-1.5 h-[13px] w-[13px]" />
              {t('avatar.upload')}
            </Button>
            {form.image && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleAvatarRemove}
                disabled={isBusy}
                data-testid="profile-avatar-remove"
              >
                {t('avatar.remove')}
              </Button>
            )}
          </div>
          {avatarError && (
            <p className="mt-2 text-[11.5px] text-danger" data-testid="profile-avatar-error">
              {avatarError}
            </p>
          )}
        </div>
      </div>

      {/* Personal info */}
      <FormSection label={t('sections.personal')}>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <LabeledField label={t('fields.firstName')} htmlFor="profile-firstName">
            <Input
              id="profile-firstName"
              data-testid="profile-firstName"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              maxLength={60}
              disabled={isBusy}
            />
          </LabeledField>
          <LabeledField label={t('fields.lastName')} htmlFor="profile-lastName">
            <Input
              id="profile-lastName"
              data-testid="profile-lastName"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              maxLength={60}
              disabled={isBusy}
            />
          </LabeledField>
        </div>
        <LabeledField
          label={t('fields.email')}
          htmlFor="profile-email"
          right={
            <button
              type="button"
              data-testid="profile-email-change"
              className="text-[12px] font-medium text-accent hover:underline"
              disabled
              aria-disabled="true"
              title={t('fields.emailChangeHint')}
            >
              {t('fields.emailChange')}
            </button>
          }
        >
          <div className="relative">
            <Input
              id="profile-email"
              data-testid="profile-email"
              value={profile?.email ?? ''}
              readOnly
              disabled
              className="pr-24"
            />
            <span
              data-testid="profile-email-verified"
              className={cn(
                'pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10.5px] font-semibold text-success'
              )}
            >
              <CheckCircle2 className="h-[11px] w-[11px]" />
              {t('fields.emailVerified')}
            </span>
          </div>
        </LabeledField>
        <LabeledField
          label={t('fields.phone')}
          htmlFor="profile-phone"
          hint={t('fields.phoneHint')}
        >
          <Input
            id="profile-phone"
            data-testid="profile-phone"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            maxLength={30}
            placeholder="+995 599 12 34 56"
            disabled={isBusy}
          />
        </LabeledField>
      </FormSection>

      {/* Preferences */}
      <FormSection label={t('sections.preferences')}>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <LabeledField label={t('fields.timezone')} htmlFor="profile-timezone">
            <Select
              value={form.timezone}
              onValueChange={(v) => updateField('timezone', v)}
              disabled={isBusy}
            >
              <SelectTrigger id="profile-timezone" data-testid="profile-timezone">
                <SelectValue placeholder={t('fields.timezonePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem
                    key={tz.value}
                    value={tz.value}
                    data-testid={`profile-timezone-option-${tz.value}`}
                  >
                    {t(`timezones.${tz.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledField>
          <LabeledField label={t('fields.dateFormat')} htmlFor="profile-dateFormat">
            <Select
              value={form.dateFormat}
              onValueChange={(v) => updateField('dateFormat', v as DateFormat)}
              disabled={isBusy}
            >
              <SelectTrigger id="profile-dateFormat" data-testid="profile-dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    data-testid={`profile-dateFormat-option-${f}`}
                  >
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledField>
        </div>
      </FormSection>

      {/* Inline action row (duplicates the shell save-bar for keyboard users / when
          the save bar is off-screen). Hidden until dirty. */}
      {isDirty && (
        <div
          data-testid="profile-form-actions"
          className="flex items-center justify-end gap-2 pt-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={isBusy}
            data-testid="profile-discard"
          >
            {tCommon('saveBar.discard')}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isBusy}
            data-testid="profile-save"
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

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
        {label}
      </h3>
      <div className="space-y-[14px]">{children}</div>
    </section>
  );
}

function LabeledField({
  label,
  hint,
  right,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  right?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-[12.5px] font-semibold text-text-default"
        >
          {label}
        </label>
        {right}
      </div>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11.5px] leading-[1.4] text-text-muted">{hint}</p>
      )}
    </div>
  );
}
