'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateMenu } from '@/hooks/use-menus';
import { useUserPlan } from '@/hooks/use-user-plan';
import {
  LangTabsInline,
  type LangCode,
  type DotStatus,
} from '@/components/admin/product-drawer/lang-tabs-inline';
import type { MenuWithDetails } from '@/types/menu';
import type { MenuVisibility } from '@/lib/validations';

// ── Local helpers ─────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MIN = 3;
const SLUG_MAX = 50;

function deriveVisibility(menu: MenuWithDetails): MenuVisibility {
  if (menu.status !== 'PUBLISHED') return 'PRIVATE_DRAFT';
  if (menu.hasPassword) return 'PASSWORD_PROTECTED';
  return 'PUBLISHED';
}

type SlugErrorKey = 'required' | 'tooShort' | 'tooLong' | 'invalidChars';

function validateSlug(value: string): SlugErrorKey | null {
  if (!value) return 'required';
  if (value.length < SLUG_MIN) return 'tooShort';
  if (value.length > SLUG_MAX) return 'tooLong';
  if (!SLUG_RE.test(value)) return 'invalidChars';
  return null;
}

// ── Section header ────────────────────────────────────────────────────────

function SectionHeader({
  label,
  helper,
}: {
  label: string;
  helper?: string;
}) {
  return (
    <div className="mb-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
        {label}
      </div>
      {helper && (
        <div className="mt-1 text-[12.5px] leading-[1.45] text-text-muted">
          {helper}
        </div>
      )}
    </div>
  );
}

// ── RadioCard ─────────────────────────────────────────────────────────────

interface RadioCardProps {
  id: string;
  name: string;
  value: MenuVisibility;
  selected: boolean;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  title: string;
  body: string;
  onSelect: (value: MenuVisibility) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function RadioCard({
  id,
  name,
  value,
  selected,
  icon: Icon,
  title,
  body,
  onSelect,
  disabled,
  children,
}: RadioCardProps) {
  return (
    <label
      data-testid={`settings-visibility-${value.toLowerCase()}`}
      data-selected={selected ? 'true' : 'false'}
      className={cn(
        'block cursor-pointer rounded-[10px] border bg-card px-[14px] py-[13px] transition-colors',
        selected
          ? 'border-text-default shadow-[0_0_0_1px_hsl(var(--text-default))]'
          : 'border-border hover:border-border-strong',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors',
            selected
              ? 'border-text-default'
              : 'border-border bg-card',
          )}
        >
          {selected && (
            <span className="h-[8px] w-[8px] rounded-full bg-text-default" />
          )}
        </span>
        <Icon
          size={15}
          strokeWidth={1.5}
          aria-hidden="true"
          className="mt-[3px] shrink-0 text-text-muted"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-text-default">
            {title}
          </div>
          <div className="mt-[3px] text-[12.5px] leading-[1.45] text-text-muted">
            {body}
          </div>
          {selected && children && (
            <div className="mt-3">{children}</div>
          )}
        </div>
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={selected}
          onChange={() => onSelect(value)}
          disabled={disabled}
          className="sr-only"
        />
      </div>
    </label>
  );
}

// ── Main section ──────────────────────────────────────────────────────────

export interface MenuUrlVisibilitySectionProps {
  menu: MenuWithDetails;
}

type NameErrorKey = 'required' | 'tooLong';
const NAME_MAX = 100;

export function MenuUrlVisibilitySection({
  menu,
}: MenuUrlVisibilitySectionProps) {
  const t = useTranslations('admin.editor.settings');
  const updateMenu = useUpdateMenu(menu.id);
  const { hasFeature } = useUserPlan();
  const multilangUnlocked = hasFeature('multilingual');

  const initialVisibility = useMemo(() => deriveVisibility(menu), [menu]);

  const [slug, setSlug] = useState(menu.slug);
  const [visibility, setVisibility] =
    useState<MenuVisibility>(initialVisibility);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [slugError, setSlugError] = useState<SlugErrorKey | 'taken' | null>(null);
  const [passwordError, setPasswordError] = useState<
    'required' | 'tooShort' | null
  >(null);

  // T21.2 — multilingual name state. Tracks all three values; the input below
  // displays only the active tab's value but all three persist together.
  const [nameKa, setNameKa] = useState(menu.nameKa ?? menu.name ?? '');
  const [nameEn, setNameEn] = useState(menu.nameEn ?? '');
  const [nameRu, setNameRu] = useState(menu.nameRu ?? '');
  const [activeLang, setActiveLang] = useState<LangCode>('KA');
  const [nameError, setNameError] = useState<{
    lang: LangCode;
    key: NameErrorKey;
  } | null>(null);

  // Sync local state when the menu refetches (e.g., other tab made changes).
  const lastSyncedRef = useRef<{
    slug: string;
    visibility: MenuVisibility;
    nameKa: string;
    nameEn: string | null;
    nameRu: string | null;
  }>({
    slug: menu.slug,
    visibility: initialVisibility,
    nameKa: menu.nameKa ?? menu.name ?? '',
    nameEn: menu.nameEn ?? null,
    nameRu: menu.nameRu ?? null,
  });

  useEffect(() => {
    const remoteNameKa = menu.nameKa ?? menu.name ?? '';
    const remoteNameEn = menu.nameEn ?? null;
    const remoteNameRu = menu.nameRu ?? null;
    if (
      lastSyncedRef.current.slug !== menu.slug ||
      lastSyncedRef.current.visibility !== initialVisibility ||
      lastSyncedRef.current.nameKa !== remoteNameKa ||
      lastSyncedRef.current.nameEn !== remoteNameEn ||
      lastSyncedRef.current.nameRu !== remoteNameRu
    ) {
      setSlug(menu.slug);
      setVisibility(initialVisibility);
      setPassword('');
      setNameKa(remoteNameKa);
      setNameEn(remoteNameEn ?? '');
      setNameRu(remoteNameRu ?? '');
      setNameError(null);
      lastSyncedRef.current = {
        slug: menu.slug,
        visibility: initialVisibility,
        nameKa: remoteNameKa,
        nameEn: remoteNameEn,
        nameRu: remoteNameRu,
      };
    }
  }, [menu.slug, menu.nameKa, menu.nameEn, menu.nameRu, menu.name, initialVisibility]);

  // Derived flags
  const slugDirty = slug !== menu.slug;
  const visibilityDirty = visibility !== initialVisibility;
  const passwordDirty =
    visibility === 'PASSWORD_PROTECTED' && password.length > 0;
  const initialNameKa = menu.nameKa ?? menu.name ?? '';
  const nameKaDirty = nameKa !== initialNameKa;
  const nameEnDirty = (menu.nameEn ?? '') !== nameEn;
  const nameRuDirty = (menu.nameRu ?? '') !== nameRu;
  const nameDirty = nameKaDirty || nameEnDirty || nameRuDirty;
  const dirty = slugDirty || visibilityDirty || passwordDirty || nameDirty;

  const nameStatuses: Record<LangCode, DotStatus> = {
    KA: nameKa.trim().length > 0 ? 'filled' : 'empty',
    EN: nameEn.trim().length > 0 ? 'filled' : 'empty',
    RU: nameRu.trim().length > 0 ? 'filled' : 'empty',
  };
  const activeNameValue = activeLang === 'KA' ? nameKa : activeLang === 'EN' ? nameEn : nameRu;
  const setActiveNameValue = (value: string) => {
    if (activeLang === 'KA') setNameKa(value);
    else if (activeLang === 'EN') setNameEn(value);
    else setNameRu(value);
    if (nameError && nameError.lang === activeLang) setNameError(null);
  };
  const namePlaceholder =
    activeLang === 'KA'
      ? t('menuName.placeholderKa')
      : activeLang === 'EN'
        ? t('menuName.placeholderEn')
        : t('menuName.placeholderRu');
  const nameAriaLabel =
    activeLang === 'KA'
      ? t('menuName.ariaLabelKa')
      : activeLang === 'EN'
        ? t('menuName.ariaLabelEn')
        : t('menuName.ariaLabelRu');

  // Public URL preview
  const { origin, host } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { origin: '', host: '' };
    }
    return {
      origin: window.location.origin,
      host: window.location.host.replace(/^www\./, ''),
    };
  }, []);

  const publicUrl = `${origin}/m/${slug || menu.slug}`;
  const hostPrefix = host ? `${host}/` : '';

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCopyUrl = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t('url.copyToast'));
    } catch {
      toast.error(t('url.copyError'));
    }
  };

  const handleSlugChange = (value: string) => {
    // Lowercase + strip spaces defensively; let user type freely otherwise
    const cleaned = value.toLowerCase().replace(/\s+/g, '-');
    setSlug(cleaned);
    if (slugError) setSlugError(null);
  };

  const handleSelectVisibility = (next: MenuVisibility) => {
    setVisibility(next);
    if (passwordError) setPasswordError(null);
    if (next !== 'PASSWORD_PROTECTED') {
      setPassword('');
    }
  };

  const handleDiscard = () => {
    setSlug(menu.slug);
    setVisibility(initialVisibility);
    setPassword('');
    setSlugError(null);
    setPasswordError(null);
    setNameKa(menu.nameKa ?? menu.name ?? '');
    setNameEn(menu.nameEn ?? '');
    setNameRu(menu.nameRu ?? '');
    setNameError(null);
  };

  const handleSave = async () => {
    const slugErr = validateSlug(slug);
    if (slugErr) {
      setSlugError(slugErr);
      return;
    }

    // T21.2 — validate menu name. KA required; all three capped at 100 chars.
    const trimmedKa = nameKa.trim();
    if (trimmedKa.length === 0) {
      setNameError({ lang: 'KA', key: 'required' });
      setActiveLang('KA');
      return;
    }
    if (trimmedKa.length > NAME_MAX) {
      setNameError({ lang: 'KA', key: 'tooLong' });
      setActiveLang('KA');
      return;
    }
    if (nameEn.trim().length > NAME_MAX) {
      setNameError({ lang: 'EN', key: 'tooLong' });
      setActiveLang('EN');
      return;
    }
    if (nameRu.trim().length > NAME_MAX) {
      setNameError({ lang: 'RU', key: 'tooLong' });
      setActiveLang('RU');
      return;
    }

    if (
      visibility === 'PASSWORD_PROTECTED' &&
      !menu.hasPassword &&
      password.trim().length < 4
    ) {
      setPasswordError(password.trim().length === 0 ? 'required' : 'tooShort');
      return;
    }

    const payload: Record<string, unknown> = {};
    if (slugDirty) payload.slug = slug;
    if (visibilityDirty) payload.visibility = visibility;
    if (passwordDirty) payload.password = password;

    // T21.2 — only send the name fields the operator actually changed. Server
    // mirrors `nameKa` → legacy `name` automatically.
    if (nameKaDirty) payload.nameKa = trimmedKa;
    if (nameEnDirty) payload.nameEn = nameEn.trim() ? nameEn.trim() : null;
    if (nameRuDirty) payload.nameRu = nameRu.trim() ? nameRu.trim() : null;

    // Also send visibility if password is being rotated but visibility didn't
    // change — the server uses visibility to decide whether to hash.
    if (passwordDirty && !('visibility' in payload)) {
      payload.visibility = visibility;
    }

    try {
      await updateMenu.mutateAsync(payload as never);
      toast.success(t('actions.saved'));
      setPassword('');
      lastSyncedRef.current = {
        slug,
        visibility,
        nameKa: trimmedKa,
        nameEn: nameEn.trim() ? nameEn.trim() : null,
        nameRu: nameRu.trim() ? nameRu.trim() : null,
      };
    } catch (err) {
      const apiError = err as { message?: string; code?: string };
      if (apiError?.code === 'SLUG_EXISTS') {
        setSlugError('taken');
      } else {
        toast.error(apiError?.message || t('actions.saveFailed'));
      }
    }
  };

  const saving = updateMenu.isPending;

  return (
    <section
      data-testid="settings-url-visibility"
      data-visibility={visibility}
      data-slug-dirty={slugDirty ? 'true' : 'false'}
      data-visibility-dirty={visibilityDirty ? 'true' : 'false'}
      aria-labelledby="settings-url-heading"
      className="flex flex-col gap-8"
    >
      {/* ── Menu name (T21.2) ────────────────────────────────────────── */}
      <div data-testid="settings-menu-name">
        <SectionHeader
          label={t('menuName.label')}
          helper={t('menuName.helper')}
        />
        <LangTabsInline
          active={activeLang}
          onChange={setActiveLang}
          statuses={nameStatuses}
          multilangUnlocked={multilangUnlocked}
          data-testid="settings-menu-name-tabs"
        />
        <Input
          data-testid={`settings-menu-name-input-${activeLang}`}
          value={activeNameValue}
          onChange={(e) => setActiveNameValue(e.target.value)}
          placeholder={namePlaceholder}
          aria-label={nameAriaLabel}
          aria-invalid={nameError?.lang === activeLang ? 'true' : 'false'}
          maxLength={NAME_MAX}
          className={cn(
            'h-[40px] bg-card text-[13px]',
            nameError?.lang === activeLang &&
              'border-danger focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]',
          )}
        />
        {nameError && nameError.lang === activeLang && (
          <p
            data-testid="settings-menu-name-error"
            role="alert"
            className="mt-2 text-[12.5px] text-danger"
          >
            {t(`menuName.errors.${nameError.key}`)}
          </p>
        )}
        {!multilangUnlocked && (
          <p
            data-testid="settings-menu-name-locked-helper"
            className="mt-2 text-[12px] leading-[1.45] text-text-muted"
          >
            {t('menuName.lockedHelper')}
          </p>
        )}
      </div>

      {/* ── Menu URL ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeader label={t('url.label')} helper={t('url.helper')} />
        <div
          data-testid="settings-url-chip"
          className={cn(
            'flex items-stretch overflow-hidden rounded-[8px] border bg-card transition-colors',
            slugError
              ? 'border-danger focus-within:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]'
              : 'border-border focus-within:border-text-default focus-within:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]',
          )}
        >
          <div
            data-testid="settings-url-prefix"
            className="flex items-center border-r border-border bg-bg px-[12px] font-mono text-[13px] text-text-muted"
          >
            {hostPrefix || 'cafelinville.ge/'}
          </div>
          <Input
            data-testid="settings-url-slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder={t('url.slugPlaceholder')}
            aria-label={t('url.slugAriaLabel')}
            aria-invalid={slugError ? 'true' : 'false'}
            maxLength={SLUG_MAX}
            className="h-[40px] rounded-none border-0 bg-card font-mono text-[13px] focus-visible:shadow-none focus-visible:border-transparent"
          />
          <button
            type="button"
            onClick={handleCopyUrl}
            data-testid="settings-url-copy"
            aria-label={t('url.copyAriaLabel')}
            className="flex items-center border-l border-border px-[12px] text-text-muted transition-colors hover:text-text-default focus-visible:outline-none focus-visible:text-text-default"
          >
            <Copy size={13} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        {slugError && (
          <p
            data-testid="settings-url-error"
            role="alert"
            className="mt-2 text-[12.5px] text-danger"
          >
            {t(`url.errors.${slugError}`)}
          </p>
        )}

        <div
          data-testid="settings-url-warning"
          role={slugDirty ? 'alert' : 'note'}
          className="mt-[10px] flex items-start gap-2 rounded-[8px] border border-warning/25 bg-warning-soft px-3 py-2 text-[12.5px] leading-[1.45] text-warning"
        >
          <AlertTriangle
            size={13}
            strokeWidth={1.5}
            aria-hidden="true"
            className="mt-[2px] shrink-0"
          />
          <span>{t('url.warning')}</span>
        </div>
      </div>

      {/* ── Visibility ───────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          label={t('visibility.label')}
          helper={t('visibility.helper')}
        />

        <div
          role="radiogroup"
          aria-label={t('visibility.ariaLabel')}
          className="flex flex-col gap-[10px]"
        >
          <RadioCard
            id="settings-vis-published"
            name="menu-visibility"
            value="PUBLISHED"
            selected={visibility === 'PUBLISHED'}
            icon={Globe}
            title={t('visibility.published.title')}
            body={t('visibility.published.body')}
            onSelect={handleSelectVisibility}
          />

          <RadioCard
            id="settings-vis-password"
            name="menu-visibility"
            value="PASSWORD_PROTECTED"
            selected={visibility === 'PASSWORD_PROTECTED'}
            icon={Lock}
            title={t('visibility.password.title')}
            body={t('visibility.password.body')}
            onSelect={handleSelectVisibility}
          >
            <div className="space-y-1">
              <label
                htmlFor="settings-vis-password-input"
                className="text-[12px] font-medium text-text-default"
              >
                {menu.hasPassword
                  ? t('visibility.password.inputLabelChange')
                  : t('visibility.password.inputLabelSet')}
              </label>
              <div className="relative">
                <input
                  id="settings-vis-password-input"
                  data-testid="settings-vis-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder={
                    menu.hasPassword
                      ? t('visibility.password.placeholderChange')
                      : t('visibility.password.placeholderSet')
                  }
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={100}
                  aria-invalid={passwordError ? 'true' : 'false'}
                  className="h-[36px] w-full rounded-[8px] border border-border bg-card pl-[12px] pr-[40px] text-[13px] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? t('visibility.password.hideAriaLabel')
                      : t('visibility.password.showAriaLabel')
                  }
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 rounded-sm p-1 text-text-muted hover:text-text-default"
                >
                  {showPassword ? (
                    <EyeOff size={14} strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Eye size={14} strokeWidth={1.5} aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p
                  data-testid="settings-vis-password-error"
                  role="alert"
                  className="text-[12px] text-danger"
                >
                  {t(`visibility.password.errors.${passwordError}`)}
                </p>
              )}
              {menu.hasPassword && (
                <p
                  data-testid="settings-vis-password-hint"
                  className="text-[11.5px] text-text-subtle"
                >
                  <Check
                    size={11}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="-mt-[1px] mr-[3px] inline-block text-success"
                  />
                  {t('visibility.password.hint')}
                </p>
              )}
            </div>
          </RadioCard>

          <RadioCard
            id="settings-vis-draft"
            name="menu-visibility"
            value="PRIVATE_DRAFT"
            selected={visibility === 'PRIVATE_DRAFT'}
            icon={EyeOff}
            title={t('visibility.draft.title')}
            body={t('visibility.draft.body')}
            onSelect={handleSelectVisibility}
          />
        </div>
      </div>

      {/* ── Save actions ─────────────────────────────────────────────── */}
      <div
        data-testid="settings-url-visibility-actions"
        className="flex items-center justify-end gap-2 border-t border-border-soft pt-4"
      >
        {dirty && !saving && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            data-testid="settings-url-visibility-discard"
          >
            {t('actions.discard')}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          data-testid="settings-url-visibility-save"
        >
          {saving && (
            <Loader2
              size={14}
              strokeWidth={2}
              className="mr-1 animate-spin"
              aria-hidden="true"
            />
          )}
          {saving ? t('actions.saving') : t('actions.save')}
        </Button>
      </div>
    </section>
  );
}
