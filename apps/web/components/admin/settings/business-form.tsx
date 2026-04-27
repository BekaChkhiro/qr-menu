'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Upload, X, Link as LinkIcon, Instagram } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUpload } from '@/hooks/use-upload';
import { useBusiness, useUpdateBusiness, type BusinessInfo, type OpeningHour } from '@/hooks/use-business';

import { useSettingsForm } from './settings-form-context';

const PRICE_RANGE_LABELS = ['₾', '₾₾', '₾₾₾', '₾₾₾₾'] as const;

const DEFAULT_OPENING_HOURS: OpeningHour[] = [
  { day: 'Monday', open: '08:00', close: '20:00', closed: false },
  { day: 'Tuesday', open: '08:00', close: '20:00', closed: false },
  { day: 'Wednesday', open: '08:00', close: '20:00', closed: false },
  { day: 'Thursday', open: '08:00', close: '22:00', closed: false },
  { day: 'Friday', open: '08:00', close: '22:00', closed: false },
  { day: 'Saturday', open: '09:00', close: '22:00', closed: false },
  { day: 'Sunday', open: '09:00', close: '18:00', closed: false },
];

interface FormState {
  logoUrl: string | null;
  businessName: string;
  tagline: string;
  cuisines: string[];
  priceRange: number;
  taxId: string;
  businessType: string;
  description: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  publicEmail: string;
  publicPhone: string;
  websiteUrl: string;
  instagramHandle: string;
  openingHours: OpeningHour[];
}

function normalizeOpeningHours(raw: OpeningHour[] | null | undefined): OpeningHour[] {
  if (!raw || raw.length === 0) return DEFAULT_OPENING_HOURS;
  // Ensure all 7 days exist with defaults for missing ones
  return DEFAULT_OPENING_HOURS.map((def, i) => raw[i] ?? def);
}

function toFormState(business: BusinessInfo | undefined | null): FormState {
  return {
    logoUrl: business?.logoUrl ?? null,
    businessName: business?.businessName ?? '',
    tagline: business?.tagline ?? '',
    cuisines: business?.cuisines ?? [],
    priceRange: business?.priceRange ?? 0,
    taxId: business?.taxId ?? '',
    businessType: business?.businessType ?? '',
    description: business?.description ?? '',
    streetAddress: business?.streetAddress ?? '',
    city: business?.city ?? '',
    postalCode: business?.postalCode ?? '',
    country: business?.country ?? 'Georgia',
    publicEmail: business?.publicEmail ?? '',
    publicPhone: business?.publicPhone ?? '',
    websiteUrl: business?.websiteUrl ?? '',
    instagramHandle: business?.instagramHandle ?? '',
    openingHours: normalizeOpeningHours(business?.openingHours),
  };
}

function diffPayload(initial: FormState, current: FormState) {
  const payload: Record<string, unknown> = {};

  const scalarFields: (keyof FormState)[] = [
    'businessName', 'tagline', 'taxId', 'businessType', 'description',
    'streetAddress', 'city', 'postalCode', 'country',
    'publicEmail', 'publicPhone', 'websiteUrl', 'instagramHandle',
  ];

  for (const key of scalarFields) {
    if (current[key] !== initial[key]) {
      payload[key] = current[key];
    }
  }

  if ((current.logoUrl ?? '') !== (initial.logoUrl ?? '')) {
    payload.logoUrl = current.logoUrl ?? '';
  }

  if (current.priceRange !== initial.priceRange) {
    payload.priceRange = current.priceRange;
  }

  if (JSON.stringify(current.cuisines) !== JSON.stringify(initial.cuisines)) {
    payload.cuisines = current.cuisines;
  }

  if (JSON.stringify(current.openingHours) !== JSON.stringify(initial.openingHours)) {
    payload.openingHours = current.openingHours;
  }

  return payload;
}

export function BusinessForm() {
  const t = useTranslations('admin.settings.businessInfo');
  const tCommon = useTranslations('admin.settings');
  const { data: business, isLoading } = useBusiness();
  const updateBusiness = useUpdateBusiness();
  const { markDirty, markClean } = useSettingsForm();

  const [initial, setInitial] = useState<FormState>(() => toFormState(business));
  const [form, setForm] = useState<FormState>(initial);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [cuisineInput, setCuisineInput] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { upload, isUploading } = useUpload({
    onSuccess: ({ url }) => {
      setForm((f) => ({ ...f, logoUrl: url }));
      setLogoError(null);
    },
    onError: (err) => {
      setLogoError(err.message);
    },
  });

  // Hydrate form state when business data loads / refreshes.
  useEffect(() => {
    if (business) {
      const next = toFormState(business);
      setInitial(next);
      setForm(next);
    }
  }, [business]);

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

  const handleLogoPick = useCallback(
    (file: File) => {
      upload(file, { preset: 'logo', folder: 'digital-menu/logos' });
    },
    [upload]
  );

  const handleLogoRemove = useCallback(() => {
    setForm((f) => ({ ...f, logoUrl: null }));
    setLogoError(null);
  }, []);

  const addCuisine = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (form.cuisines.includes(trimmed)) return;
      if (form.cuisines.length >= 4) {
        toast.error(t('cuisines.maxReached'));
        return;
      }
      setForm((f) => ({ ...f, cuisines: [...f.cuisines, trimmed] }));
      setCuisineInput('');
    },
    [form.cuisines, t]
  );

  const removeCuisine = useCallback((value: string) => {
    setForm((f) => ({ ...f, cuisines: f.cuisines.filter((c) => c !== value) }));
  }, []);

  const updateOpeningHour = useCallback(
    (index: number, patch: Partial<OpeningHour>) => {
      setForm((f) => {
        const next = f.openingHours.map((oh, i) => (i === index ? { ...oh, ...patch } : oh));
        return { ...f, openingHours: next };
      });
    },
    []
  );

  const handleCopyToAll = useCallback(
    (sourceIndex: number) => {
      const source = form.openingHours[sourceIndex];
      if (!source || source.closed) return;
      setForm((f) => ({
        ...f,
        openingHours: f.openingHours.map((oh) =>
          oh.day === source.day ? oh : { ...oh, open: source.open, close: source.close, closed: false }
        ),
      }));
      toast.success(t('hours.copyToAllSuccess', { day: source.day }));
    },
    [form.openingHours, t]
  );

  const handleDiscard = useCallback(() => {
    setForm(initial);
    setLogoError(null);
    setCuisineInput('');
  }, [initial]);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    try {
      const updated = await updateBusiness.mutateAsync(dirtyPayload);
      const next = toFormState(updated);
      setInitial(next);
      setForm(next);
      markClean();
      toast.success(t('toast.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed'));
    }
  }, [dirtyPayload, isDirty, markClean, t, updateBusiness]);

  const isBusy = updateBusiness.isPending || isUploading;
  const firstOpenDayIndex = form.openingHours.findIndex((oh) => !oh.closed);

  if (isLoading && !business) {
    return (
      <div
        data-testid="settings-business-loading"
        className="rounded-card border border-border bg-card p-8 text-center text-text-muted"
      >
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <form
      data-testid="settings-business-form"
      data-dirty={isDirty ? 'true' : 'false'}
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="space-y-7"
    >
      {/* Logo */}
      <FormSection label={t('sections.logo')} helper={t('sections.logoHelper')}>
        <div className="flex items-center gap-[14px]">
          <div
            data-testid="business-logo"
            className="flex h-[92px] w-[92px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-[28px] font-bold tracking-[-0.5px] text-white"
            style={{
              background: form.logoUrl ? undefined : 'linear-gradient(135deg, #D4A574 0%, #B8864C 100%)',
            }}
          >
            {form.logoUrl ? (
              <Image
                src={form.logoUrl}
                alt={form.businessName || 'Logo'}
                width={92}
                height={92}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-serif">{form.businessName?.[0]?.toUpperCase() || 'L'}</span>
            )}
          </div>
          <div className="flex flex-col gap-[6px]">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => logoInputRef.current?.click()}
              disabled={isBusy}
              data-testid="business-logo-upload"
            >
              {isUploading ? (
                <Loader2 className="mr-1.5 h-[13px] w-[13px] animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-[13px] w-[13px]" />
              )}
              {form.logoUrl ? t('logo.replace') : t('logo.upload')}
            </Button>
            {form.logoUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleLogoRemove}
                disabled={isBusy}
                data-testid="business-logo-remove"
              >
                {t('logo.remove')}
              </Button>
            )}
            {logoError && (
              <p className="text-[11.5px] text-danger" data-testid="business-logo-error">
                {logoError}
              </p>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleLogoPick(file);
              event.target.value = '';
            }}
          />
        </div>
      </FormSection>

      {/* Business details */}
      <FormSection label={t('sections.details')}>
        <LabeledField label={t('fields.businessName')} htmlFor="business-name">
          <Input
            id="business-name"
            data-testid="business-name"
            value={form.businessName}
            onChange={(e) => updateField('businessName', e.target.value)}
            maxLength={120}
            disabled={isBusy}
          />
        </LabeledField>

        <LabeledField label={t('fields.tagline')} htmlFor="business-tagline" hint={t('fields.taglineHint')}>
          <Input
            id="business-tagline"
            data-testid="business-tagline"
            value={form.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            maxLength={200}
            disabled={isBusy}
          />
        </LabeledField>

        <LabeledField label={t('fields.cuisine')} hint={t('fields.cuisineHint')}>
          <div
            data-testid="business-cuisine-chips"
            className="flex min-h-[40px] flex-wrap gap-[6px] rounded-[8px] border border-border bg-card p-[7px_8px]"
          >
            {form.cuisines.map((c) => (
              <span
                key={c}
                data-testid={`business-cuisine-chip-${c}`}
                className="inline-flex items-center gap-[5px] rounded-[5px] border border-accent/20 bg-accent-soft px-[10px] py-[4px] text-[12px] font-[550] text-accent"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCuisine(c)}
                  className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-[3px] hover:bg-accent/10"
                  aria-label={t('cuisines.remove', { cuisine: c })}
                  data-testid={`business-cuisine-remove-${c}`}
                >
                  <X className="h-[10px] w-[10px]" strokeWidth={2.2} />
                </button>
              </span>
            ))}
            {form.cuisines.length < 4 && (
              <div className="relative">
                <input
                  type="text"
                  value={cuisineInput}
                  onChange={(e) => setCuisineInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCuisine(cuisineInput);
                    }
                    if (e.key === 'Backspace' && !cuisineInput && form.cuisines.length > 0) {
                      removeCuisine(form.cuisines[form.cuisines.length - 1]);
                    }
                  }}
                  onBlur={() => {
                    if (cuisineInput.trim()) addCuisine(cuisineInput);
                  }}
                  placeholder={form.cuisines.length === 0 ? t('cuisines.add') : ''}
                  disabled={isBusy}
                  data-testid="business-cuisine-input"
                  className="h-[26px] min-w-[80px] bg-transparent text-[12px] text-text-default outline-none placeholder:text-text-muted"
                />
              </div>
            )}
          </div>
        </LabeledField>

        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <LabeledField label={t('fields.priceRange')} hint={t('fields.priceRangeHint')}>
            <div
              role="radiogroup"
              aria-label={t('fields.priceRange')}
              data-testid="business-price-range"
              className="flex gap-[3px] rounded-[8px] bg-chip p-[3px]"
            >
              {PRICE_RANGE_LABELS.map((label, i) => {
                const value = i + 1;
                const active = form.priceRange === value;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-testid={`business-price-range-${value}`}
                    data-active={active ? 'true' : 'false'}
                    onClick={() => updateField('priceRange', active ? 0 : value)}
                    className={`flex-1 rounded-[6px] py-[6px] text-center text-[13px] transition-all ${
                      active
                        ? 'bg-white font-semibold text-text-default shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                        : 'font-medium text-text-muted hover:text-text-default'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </LabeledField>

          <LabeledField label={t('fields.taxId')} htmlFor="business-taxId">
            <Input
              id="business-taxId"
              data-testid="business-taxId"
              value={form.taxId}
              onChange={(e) => updateField('taxId', e.target.value)}
              maxLength={50}
              disabled={isBusy}
            />
          </LabeledField>
        </div>

        <LabeledField label={t('fields.businessType')} htmlFor="business-type">
          <Input
            id="business-type"
            data-testid="business-businessType"
            value={form.businessType}
            onChange={(e) => updateField('businessType', e.target.value)}
            maxLength={60}
            disabled={isBusy}
            placeholder={t('fields.businessTypePlaceholder')}
          />
        </LabeledField>

        <LabeledField label={t('fields.description')} htmlFor="business-description" hint={t('fields.descriptionHint')}>
          <Textarea
            id="business-description"
            data-testid="business-description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            maxLength={500}
            showCount
            rows={3}
            disabled={isBusy}
          />
        </LabeledField>
      </FormSection>

      {/* Address */}
      <FormSection label={t('sections.address')}>
        <LabeledField label={t('fields.streetAddress')} htmlFor="business-street">
          <Input
            id="business-street"
            data-testid="business-streetAddress"
            value={form.streetAddress}
            onChange={(e) => updateField('streetAddress', e.target.value)}
            maxLength={200}
            disabled={isBusy}
          />
        </LabeledField>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-[2fr_1fr_1fr]">
          <LabeledField label={t('fields.city')} htmlFor="business-city">
            <Input
              id="business-city"
              data-testid="business-city"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              maxLength={100}
              disabled={isBusy}
            />
          </LabeledField>
          <LabeledField label={t('fields.postalCode')} htmlFor="business-postal">
            <Input
              id="business-postal"
              data-testid="business-postalCode"
              value={form.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              maxLength={20}
              disabled={isBusy}
            />
          </LabeledField>
          <LabeledField label={t('fields.country')} htmlFor="business-country">
            <Input
              id="business-country"
              data-testid="business-country"
              value={form.country}
              onChange={(e) => updateField('country', e.target.value)}
              maxLength={100}
              disabled={isBusy}
            />
          </LabeledField>
        </div>
      </FormSection>

      {/* Contact & social */}
      <FormSection label={t('sections.contact')}>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <LabeledField label={t('fields.publicEmail')} htmlFor="business-publicEmail">
            <Input
              id="business-publicEmail"
              data-testid="business-publicEmail"
              value={form.publicEmail}
              onChange={(e) => updateField('publicEmail', e.target.value)}
              maxLength={120}
              disabled={isBusy}
            />
          </LabeledField>
          <LabeledField label={t('fields.publicPhone')} htmlFor="business-publicPhone">
            <Input
              id="business-publicPhone"
              data-testid="business-publicPhone"
              value={form.publicPhone}
              onChange={(e) => updateField('publicPhone', e.target.value)}
              maxLength={30}
              disabled={isBusy}
            />
          </LabeledField>
        </div>
        <LabeledField label={t('fields.website')} htmlFor="business-website">
          <div className="relative">
            <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-text-muted" />
            <Input
              id="business-website"
              data-testid="business-websiteUrl"
              value={form.websiteUrl}
              onChange={(e) => updateField('websiteUrl', e.target.value)}
              maxLength={200}
              disabled={isBusy}
              className="pl-8"
              placeholder="https://"
            />
          </div>
        </LabeledField>
        <LabeledField label={t('fields.instagram')} htmlFor="business-instagram">
          <div className="relative">
            <Instagram className="pointer-events-none absolute left-3 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-text-muted" />
            <Input
              id="business-instagram"
              data-testid="business-instagramHandle"
              value={form.instagramHandle}
              onChange={(e) => updateField('instagramHandle', e.target.value)}
              maxLength={100}
              disabled={isBusy}
              className="pl-8"
              placeholder="@handle"
            />
          </div>
        </LabeledField>
      </FormSection>

      {/* Opening hours */}
      <FormSection label={t('sections.hours')}>
        <div
          data-testid="business-opening-hours"
          className="overflow-hidden rounded-[10px] border border-border bg-card"
        >
          {form.openingHours.map((oh, i) => (
            <div
              key={oh.day}
              data-testid={`business-hours-row-${oh.day.toLowerCase()}`}
              data-closed={oh.closed ? 'true' : 'false'}
              className="flex items-center gap-[10px] px-[14px] py-[10px] text-[13px]"
              style={{
                borderBottom: i < 6 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <Switch
                checked={!oh.closed}
                onCheckedChange={(checked) =>
                  updateOpeningHour(i, { closed: !checked })
                }
                disabled={isBusy}
                data-testid={`business-hours-toggle-${oh.day.toLowerCase()}`}
                aria-label={t('hours.toggle', { day: oh.day })}
              />
              <div
                className="w-[96px] font-medium"
                style={{ color: oh.closed ? 'hsl(var(--text-subtle))' : 'hsl(var(--text-default))' }}
              >
                {t(`days.${oh.day.toLowerCase()}`)}
              </div>
              {oh.closed ? (
                <div className="text-[12.5px] italic text-text-subtle">
                  {t('hours.closed')}
                </div>
              ) : (
                <div className="flex items-center gap-[6px]">
                  <input
                    type="time"
                    value={oh.open}
                    onChange={(e) => updateOpeningHour(i, { open: e.target.value })}
                    disabled={isBusy}
                    data-testid={`business-hours-open-${oh.day.toLowerCase()}`}
                    className="rounded-[6px] border border-border bg-[#FAFAF9] px-[10px] py-[4px] text-[12.5px] text-text-default tabular-nums focus:border-text-default focus:outline-none"
                  />
                  <span className="text-[12px] text-text-subtle">—</span>
                  <input
                    type="time"
                    value={oh.close}
                    onChange={(e) => updateOpeningHour(i, { close: e.target.value })}
                    disabled={isBusy}
                    data-testid={`business-hours-close-${oh.day.toLowerCase()}`}
                    className="rounded-[6px] border border-border bg-[#FAFAF9] px-[10px] py-[4px] text-[12.5px] text-text-default tabular-nums focus:border-text-default focus:outline-none"
                  />
                </div>
              )}
              {!oh.closed && (
                <button
                  type="button"
                  onClick={() => handleCopyToAll(i)}
                  disabled={isBusy}
                  data-testid={`business-hours-copy-${oh.day.toLowerCase()}`}
                  className={`ml-auto text-[11.5px] font-[550] ${
                    i === firstOpenDayIndex ? 'text-accent' : 'text-text-subtle hover:text-text-default'
                  }`}
                >
                  {t('hours.copyToAll')}
                </button>
              )}
            </div>
          ))}
        </div>
      </FormSection>

      {/* Inline action row */}
      {isDirty && (
        <div
          data-testid="business-form-actions"
          className="flex items-center justify-end gap-2 pt-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={isBusy}
            data-testid="business-discard"
          >
            {tCommon('saveBar.discard')}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isBusy}
            data-testid="business-save"
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
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5">
      <div>
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
          {label}
        </h3>
        {helper ? (
          <p className="mt-0.5 text-[11.5px] leading-[1.4] text-text-muted">{helper}</p>
        ) : null}
      </div>
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
