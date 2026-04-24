'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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

export function MenuUrlVisibilitySection({
  menu,
}: MenuUrlVisibilitySectionProps) {
  const t = useTranslations('admin.editor.settings');
  const updateMenu = useUpdateMenu(menu.id);

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

  // Sync local state when the menu refetches (e.g., other tab made changes).
  const lastSyncedRef = useRef<{
    slug: string;
    visibility: MenuVisibility;
  }>({ slug: menu.slug, visibility: initialVisibility });

  useEffect(() => {
    if (
      lastSyncedRef.current.slug !== menu.slug ||
      lastSyncedRef.current.visibility !== initialVisibility
    ) {
      setSlug(menu.slug);
      setVisibility(initialVisibility);
      setPassword('');
      lastSyncedRef.current = {
        slug: menu.slug,
        visibility: initialVisibility,
      };
    }
  }, [menu.slug, initialVisibility]);

  // Derived flags
  const slugDirty = slug !== menu.slug;
  const visibilityDirty = visibility !== initialVisibility;
  const passwordDirty =
    visibility === 'PASSWORD_PROTECTED' && password.length > 0;
  const dirty = slugDirty || visibilityDirty || passwordDirty;

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
  };

  const handleSave = async () => {
    const slugErr = validateSlug(slug);
    if (slugErr) {
      setSlugError(slugErr);
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

    // Also send visibility if password is being rotated but visibility didn't
    // change — the server uses visibility to decide whether to hash.
    if (passwordDirty && !('visibility' in payload)) {
      payload.visibility = visibility;
    }

    try {
      await updateMenu.mutateAsync(payload as never);
      toast.success(t('actions.saved'));
      setPassword('');
      lastSyncedRef.current = { slug, visibility };
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
