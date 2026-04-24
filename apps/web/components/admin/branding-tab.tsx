'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Lock, Type } from 'lucide-react';

import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/image-upload';
import { useUpdateMenu } from '@/hooks/use-menus';
import { cn } from '@/lib/utils';
import type { Menu, MenuWithDetails } from '@/types/menu';

// ── Design source: qr-menu-design/components/menu-editor.jsx:318-467 ─────────
// Palette matches the 8 swatches in BrandingLeftColumn (line 320).
const COLOR_PALETTE = [
  '#18181B',
  '#B8633D',
  '#3F7E3F',
  '#5D7A91',
  '#8A5E3C',
  '#7A5A8C',
  '#C9B28A',
  '#B8423D',
] as const;

// Font family presets. Design shows a single Select with "Inter · Geometric
// sans — good for menus" subtitle (line 415-418). We write the same family to
// both headingFont + bodyFont for the "single font family" UX.
const FONT_PRESETS = [
  { value: 'Inter', sub: 'Geometric sans · good for menus' },
  { value: 'Playfair Display', sub: 'Classic serif · elegant' },
  { value: 'Noto Sans Georgian', sub: 'Native script-first' },
  { value: 'Lora', sub: 'Humanist serif · warm' },
  { value: 'BPG Arial', sub: 'Georgian sans' },
] as const;

const DEFAULT_PRIMARY = '#B8633D';
const DEFAULT_RADIUS = 12;
const DEFAULT_FONT = 'Inter';

interface BrandingTabProps {
  menu: Menu | MenuWithDetails;
  /**
   * FREE plan → render locked overlay over blurred form controls.
   * Pass `hasCustomBranding = hasFeature('customBranding')`.
   */
  hasCustomBranding: boolean;
}

export function BrandingTab({ menu, hasCustomBranding }: BrandingTabProps) {
  const t = useTranslations('admin.editor.branding');
  const updateMenu = useUpdateMenu(menu.id);

  // Local state drives the preview and the hex input; persisted via the
  // existing `useUpdateMenu` mutation. Saves fire on commit (slider release,
  // swatch click, select change) so the preview iframe reloads via the
  // existing `refreshKey` bump wired in menus/[id]/page.tsx.
  const [primaryColor, setPrimaryColor] = useState(
    menu.primaryColor || DEFAULT_PRIMARY,
  );
  const [cornerRadius, setCornerRadius] = useState(
    menu.cornerRadius ?? DEFAULT_RADIUS,
  );
  const [fontFamily, setFontFamily] = useState(
    menu.headingFont || DEFAULT_FONT,
  );

  // Keep local state in sync if the menu is refetched externally (pusher).
  const prevMenuIdRef = useRef(menu.id);
  useEffect(() => {
    if (prevMenuIdRef.current !== menu.id) {
      prevMenuIdRef.current = menu.id;
      setPrimaryColor(menu.primaryColor || DEFAULT_PRIMARY);
      setCornerRadius(menu.cornerRadius ?? DEFAULT_RADIUS);
      setFontFamily(menu.headingFont || DEFAULT_FONT);
    }
  }, [menu.id, menu.primaryColor, menu.cornerRadius, menu.headingFont]);

  const save = async (patch: Parameters<typeof updateMenu.mutateAsync>[0]) => {
    if (!hasCustomBranding) return;
    try {
      await updateMenu.mutateAsync(patch);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('saveError'),
      );
    }
  };

  const handleSwatchClick = (color: string) => {
    setPrimaryColor(color);
    void save({ primaryColor: color });
  };

  const handleHexBlur = (value: string) => {
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return;
    setPrimaryColor(normalized.toUpperCase());
    void save({ primaryColor: normalized });
  };

  const handleRadiusCommit = (next: number[]) => {
    const value = next[0] ?? DEFAULT_RADIUS;
    setCornerRadius(value);
    void save({ cornerRadius: value });
  };

  const handleFontChange = (next: string) => {
    setFontFamily(next);
    void save({ headingFont: next, bodyFont: next });
  };

  const handleLogoChange = (url: string | null) => {
    void save({ logoUrl: url });
  };

  const handleCoverChange = (url: string | null) => {
    void save({ coverImageUrl: url });
  };

  const isLocked = !hasCustomBranding;

  return (
    <div
      data-testid="editor-branding-tab"
      data-plan-locked={isLocked || undefined}
      className="relative"
    >
      <div
        className={cn(
          'flex flex-col gap-4',
          isLocked && 'pointer-events-none select-none blur-[6px] opacity-55',
        )}
        aria-hidden={isLocked || undefined}
      >
        <BrandingCard>
          <div className="flex flex-col gap-[18px]">
            {/* ── Logo ─────────────────────────────────────────────────── */}
            <BrandingSection label={t('logo.label')}>
              <div className="w-[200px]">
                <ImageUpload
                  value={menu.logoUrl || null}
                  onChange={handleLogoChange}
                  preset="logo"
                  aspectRatio="square"
                />
              </div>
              <p className="mt-2 text-[10.5px] text-text-subtle">
                {t('logo.hint')}
              </p>
            </BrandingSection>

            {/* ── Cover image ──────────────────────────────────────────── */}
            <BrandingSection label={t('cover.label')}>
              <ImageUpload
                value={menu.coverImageUrl || null}
                onChange={handleCoverChange}
                preset="promotion"
                aspectRatio="video"
              />
            </BrandingSection>

            {/* ── Primary color ────────────────────────────────────────── */}
            <BrandingSection label={t('primaryColor.label')}>
              <div
                className="mb-2 flex gap-[6px]"
                role="radiogroup"
                aria-label={t('primaryColor.label')}
              >
                {COLOR_PALETTE.map((color) => {
                  const isSelected =
                    primaryColor.toUpperCase() === color.toUpperCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={color}
                      data-testid={`branding-swatch-${color.slice(1).toLowerCase()}`}
                      onClick={() => handleSwatchClick(color)}
                      className={cn(
                        'h-[26px] w-[26px] rounded-[6px] transition-shadow',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                        isSelected
                          ? 'border-2 border-text-default'
                          : 'border border-border-soft',
                      )}
                      style={{ background: color }}
                    />
                  );
                })}
              </div>
              <HexInput
                value={primaryColor}
                onChange={setPrimaryColor}
                onCommit={handleHexBlur}
              />
            </BrandingSection>
          </div>
        </BrandingCard>

        <BrandingCard>
          <div className="flex flex-col gap-[18px]">
            {/* ── Font family ──────────────────────────────────────────── */}
            <BrandingSection label={t('font.label')}>
              <Select value={fontFamily} onValueChange={handleFontChange}>
                <SelectTrigger
                  data-testid="branding-font-select"
                  className="h-auto rounded-[8px] border border-border bg-white px-3 py-[9px] text-left"
                >
                  <div className="flex flex-1 items-center gap-[10px]">
                    <Type
                      size={14}
                      strokeWidth={1.5}
                      className="text-text-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[13px] font-medium text-text-default">
                        {fontFamily}
                      </div>
                      <div className="truncate text-[10.5px] text-text-muted">
                        {FONT_PRESETS.find((f) => f.value === fontFamily)?.sub ??
                          t('font.custom')}
                      </div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {FONT_PRESETS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span
                        className="font-medium text-[13px]"
                        style={{ fontFamily: font.value }}
                      >
                        {font.value}
                      </span>
                      <span className="ml-2 text-[11px] text-text-muted">
                        {font.sub}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </BrandingSection>

            {/* ── Corner radius ────────────────────────────────────────── */}
            <div>
              <div className="mb-[10px] flex items-baseline justify-between">
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
                  {t('radius.label')}
                </span>
                <span
                  data-testid="branding-radius-value"
                  className="font-mono text-[12px] tabular-nums text-text-default"
                >
                  {cornerRadius}px
                </span>
              </div>
              <Slider
                data-testid="branding-radius-slider"
                value={[cornerRadius]}
                min={0}
                max={24}
                step={1}
                onValueChange={(next) => {
                  setCornerRadius(next[0] ?? DEFAULT_RADIUS);
                }}
                onValueCommit={handleRadiusCommit}
                aria-label={t('radius.label')}
              />
              <div className="mt-1 flex justify-between font-mono text-[10.5px] text-text-subtle">
                <span>0</span>
                <span>24</span>
              </div>
            </div>
          </div>
        </BrandingCard>
      </div>

      {isLocked && <BrandingLockedOverlay t={t} />}

      {updateMenu.isPending && !isLocked && (
        <div
          role="status"
          aria-live="polite"
          data-testid="branding-saving"
          className="pointer-events-none absolute right-3 top-3 flex items-center gap-[6px] rounded-[7px] bg-card px-[10px] py-[6px] text-[11.5px] text-text-muted shadow-xs ring-1 ring-border"
        >
          <Loader2 size={12} className="animate-spin" />
          {t('saving')}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function BrandingCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-card p-[18px]">
      {children}
    </section>
  );
}

function BrandingSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
        {label}
      </div>
      {children}
    </div>
  );
}

function HexInput({
  value,
  onChange,
  onCommit,
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit: (next: string) => void;
}) {
  // Track the draft separately so we don't normalize on every keystroke.
  const [draft, setDraft] = useState(value.replace(/^#/, '').toUpperCase());
  useEffect(() => {
    setDraft(value.replace(/^#/, '').toUpperCase());
  }, [value]);

  return (
    <label className="flex items-center gap-2 rounded-[7px] border border-border bg-white px-[10px] py-[7px]">
      <span
        className="h-[18px] w-[18px] rounded-[4px] border border-border-soft"
        style={{ background: value }}
        aria-hidden="true"
      />
      <span className="text-[12px] text-text-muted">#</span>
      <input
        data-testid="branding-hex-input"
        type="text"
        value={draft}
        maxLength={6}
        onChange={(e) => {
          const next = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
          setDraft(next);
          onChange(`#${next}`);
        }}
        onBlur={() => onCommit(`#${draft}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onCommit(`#${draft}`);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="flex-1 bg-transparent font-mono text-[13px] text-text-default outline-none"
        aria-label="Hex color"
        spellCheck={false}
      />
    </label>
  );
}

function BrandingLockedOverlay({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div
      data-testid="branding-locked-overlay"
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'hsl(var(--bg) / 0.55)' }}
    >
      <div className="max-w-[340px] rounded-card border border-border bg-card px-6 py-5 text-center shadow-xs">
        <div className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
          <Lock className="h-[17px] w-[17px]" strokeWidth={1.5} />
        </div>
        <div className="mb-1 text-[14.5px] font-semibold text-text-default">
          {t('locked.title')}
        </div>
        <div className="mb-3 text-[12.5px] leading-[1.5] text-text-muted">
          {t('locked.body')}
        </div>
        <Link
          href="/admin/settings/billing"
          data-testid="branding-upgrade-cta"
          className="inline-flex items-center justify-center rounded-[7px] bg-text-default px-[14px] py-[7px] text-[12.5px] font-medium text-white hover:opacity-90"
        >
          {t('locked.cta')}
        </Link>
      </div>
    </div>
  );
}

