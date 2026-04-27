'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useMenus } from '@/hooks/use-menus';
import { useLocale } from '@/hooks/use-locale';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { setLocale } from '@/lib/actions/locale';
import { cn } from '@/lib/utils';

import { useSettingsForm } from './settings-form-context';

type Currency = 'GEL' | 'USD' | 'EUR';
type PriceFormat = '12.50 ₾' | '₾12.50' | '12,50 ₾';

const CURRENCIES: Currency[] = ['GEL', 'USD', 'EUR'];
const PRICE_FORMATS: PriceFormat[] = ['12.50 ₾', '₾12.50', '12,50 ₾'];

interface FormState {
  currency: Currency;
  priceFormat: PriceFormat;
}

function toFormState(profile: ReturnType<typeof useProfile>['data']): FormState {
  return {
    currency: (profile?.currency as Currency) ?? 'GEL',
    priceFormat: (profile?.priceFormat as PriceFormat) ?? '12.50 ₾',
  };
}

function diffPayload(initial: FormState, current: FormState) {
  const payload: Record<string, string> = {};
  if (current.currency !== initial.currency) payload.currency = current.currency;
  if (current.priceFormat !== initial.priceFormat) payload.priceFormat = current.priceFormat;
  return payload;
}

export function LanguageForm() {
  const t = useTranslations('admin.settings.language');
  const tCommon = useTranslations('admin.settings');
  const currentLocale = useLocale();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { markDirty, markClean } = useSettingsForm();
  const { data: menusData } = useMenus({ limit: 100 });

  const [interfaceLang, setInterfaceLang] = useState<Locale>(currentLocale);
  const [initial, setInitial] = useState<FormState>(() => toFormState(profile));
  const [form, setForm] = useState<FormState>(initial);

  // Hydrate form when profile loads
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

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const handleInterfaceLangChange = useCallback(
    async (locale: Locale) => {
      setInterfaceLang(locale);
      try {
        await setLocale(locale);
        window.location.reload();
      } catch {
        toast.error(t('interfaceLang.error'));
      }
    },
    [t]
  );

  const handleDiscard = useCallback(() => {
    setForm(initial);
  }, [initial]);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    try {
      const updated = await updateProfile.mutateAsync(dirtyPayload);
      const next: FormState = {
        currency: (updated.currency as Currency) ?? 'GEL',
        priceFormat: (updated.priceFormat as PriceFormat) ?? '12.50 ₾',
      };
      setInitial(next);
      setForm(next);
      markClean();
      toast.success(t('toast.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveFailed'));
    }
  }, [dirtyPayload, isDirty, markClean, t, updateProfile]);

  const isBusy = updateProfile.isPending;

  // Menu languages summary
  const menus = menusData?.data ?? [];
  const totalMenus = menus.length;
  const enEnabledMenus = menus.filter((m) => m.enabledLanguages.includes('EN')).length;
  const ruEnabledMenus = menus.filter((m) => m.enabledLanguages.includes('RU')).length;

  const langRows: {
    code: string;
    name: string;
    native: string;
    primary?: boolean;
    enabled: boolean;
    comingSoon?: boolean;
    flagClass: string;
    status: string;
  }[] = [
    {
      code: 'KA',
      name: t('menuLanguages.names.ka'),
      native: 'ქართული',
      primary: true,
      enabled: true,
      flagClass: 'bg-[#C02024]',
      status: t('menuLanguages.status.primary'),
    },
    {
      code: 'EN',
      name: t('menuLanguages.names.en'),
      native: 'English',
      enabled: enEnabledMenus > 0,
      flagClass: 'bg-[#1A3A7E]',
      status:
        totalMenus === 0
          ? t('menuLanguages.status.noMenus')
          : t('menuLanguages.status.enabledOnMenus', { count: enEnabledMenus, total: totalMenus }),
    },
    {
      code: 'RU',
      name: t('menuLanguages.names.ru'),
      native: 'Русский',
      enabled: ruEnabledMenus > 0,
      flagClass: 'bg-[#9B9B9B]',
      status:
        totalMenus === 0
          ? t('menuLanguages.status.noMenus')
          : t('menuLanguages.status.enabledOnMenus', { count: ruEnabledMenus, total: totalMenus }),
    },
    {
      code: 'TR',
      name: t('menuLanguages.names.tr'),
      native: 'Türkçe',
      comingSoon: true,
      enabled: false,
      flagClass: 'bg-[#B89968]',
      status: t('menuLanguages.status.comingSoon'),
    },
  ];

  const isPro = profile?.plan === 'PRO';

  if (profileLoading && !profile) {
    return (
      <div
        data-testid="settings-language-loading"
        className="rounded-card border border-border bg-card p-8 text-center text-text-muted"
      >
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <form
      data-testid="settings-language-form"
      data-dirty={isDirty ? 'true' : 'false'}
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="space-y-7"
    >
      {/* Admin interface */}
      <FormSection label={t('sections.interface')} hint={t('sections.interfaceHint')}>
        <LabeledField label={t('fields.interfaceLanguage')} htmlFor="language-interface">
          <Select
            value={interfaceLang}
            onValueChange={(v) => handleInterfaceLangChange(v as Locale)}
            disabled={isBusy}
          >
            <SelectTrigger id="language-interface" data-testid="language-interface-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((locale) => (
                <SelectItem key={locale} value={locale} data-testid={`language-option-${locale}`}>
                  {localeNames[locale]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledField>
      </FormSection>

      {/* Menu languages */}
      <FormSection label={t('sections.menuLanguages')} hint={t('sections.menuLanguagesHint')}>
        <div
          className="overflow-hidden rounded-card border border-border bg-card"
          data-testid="language-menu-langs-card"
        >
          {langRows.map((row, i) => (
            <div
              key={row.code}
              className={cn(
                'flex items-center gap-3.5 px-4 py-3.5',
                i < langRows.length - 1 && 'border-b border-border'
              )}
              data-testid={`language-row-${row.code.toLowerCase()}`}
            >
              {/* Flag tile */}
              <div
                className={cn(
                  'flex h-7 w-[38px] flex-shrink-0 items-center justify-center rounded-[5px] text-[11px] font-bold tracking-[0.4px] text-white',
                  row.flagClass
                )}
              >
                {row.code}
              </div>

              {/* Name + status */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-text-default">{row.name}</span>
                  {row.primary && (
                    <span className="rounded bg-text-default px-[7px] py-[2px] text-[10px] font-bold tracking-[0.4px] text-white">
                      {t('menuLanguages.primaryBadge')}
                    </span>
                  )}
                  {row.comingSoon && (
                    <span className="rounded bg-chip px-[7px] py-[2px] text-[10px] font-bold tracking-[0.4px] text-text-muted">
                      {t('menuLanguages.comingSoonBadge')}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[11.5px] text-text-muted">
                  {row.native}
                  {row.status && (
                    <>
                      {' · '}
                      {row.status}
                    </>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <Switch
                checked={row.enabled}
                disabled
                aria-label={t('menuLanguages.toggleAria', { language: row.name })}
                data-testid={`language-toggle-${row.code.toLowerCase()}`}
              />
            </div>
          ))}
        </div>

        {/* AI translate banner */}
        {isPro && (
          <div
            className="mt-3 flex items-center gap-3 rounded-card border border-accent/10 bg-accent-soft px-3.5 py-3.5"
            data-testid="language-ai-translate-banner"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-accent">
              <Sparkles className="h-[15px] w-[15px]" />
            </div>
            <div className="min-w-0 flex-1 text-[12.5px] leading-[1.45] text-text-default">
              <strong className="font-semibold">{t('aiTranslate.title')}</strong>{' '}
              {t('aiTranslate.body')}
            </div>
            <Button type="button" size="sm" variant="default" disabled>
              {t('aiTranslate.cta')}
            </Button>
          </div>
        )}

        {!isPro && (
          <div
            className="mt-3 flex items-center gap-3 rounded-card border border-border bg-card px-3.5 py-3.5"
            data-testid="language-ai-translate-locked"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-chip text-text-muted">
              <Sparkles className="h-[15px] w-[15px]" />
            </div>
            <div className="min-w-0 flex-1 text-[12.5px] leading-[1.45] text-text-muted">
              {t('aiTranslate.lockedBody')}
            </div>
            <Button type="button" size="sm" variant="secondary" asChild>
              <a href="/admin/settings/billing">{t('aiTranslate.upgradeCta')}</a>
            </Button>
          </div>
        )}
      </FormSection>

      {/* Currency & formatting */}
      <FormSection label={t('sections.currency')}>
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <LabeledField label={t('fields.currency')} htmlFor="language-currency">
            <Select
              value={form.currency}
              onValueChange={(v) => updateField('currency', v as Currency)}
              disabled={isBusy}
            >
              <SelectTrigger id="language-currency" data-testid="language-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c} data-testid={`language-currency-option-${c}`}>
                    {t(`currencies.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledField>
          <LabeledField label={t('fields.priceFormat')} htmlFor="language-priceFormat">
            <Select
              value={form.priceFormat}
              onValueChange={(v) => updateField('priceFormat', v as PriceFormat)}
              disabled={isBusy}
            >
              <SelectTrigger id="language-priceFormat" data-testid="language-priceFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_FORMATS.map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    data-testid={`language-priceFormat-option-${f === '12.50 ₾' ? 'trailing' : f === '₾12.50' ? 'leading' : 'comma'}`}
                  >
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledField>
        </div>
      </FormSection>

      {/* Inline action row */}
      {isDirty && (
        <div
          data-testid="language-form-actions"
          className="flex items-center justify-end gap-2 pt-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={isBusy}
            data-testid="language-discard"
          >
            {tCommon('saveBar.discard')}
          </Button>
          <Button type="submit" size="sm" disabled={isBusy} data-testid="language-save">
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
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
        {label}
      </h3>
      {hint && <p className="text-[11.5px] leading-[1.4] text-text-muted">{hint}</p>}
      <div className="space-y-[14px]">{children}</div>
    </section>
  );
}

function LabeledField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
        {label}
      </label>
      {children}
    </div>
  );
}
