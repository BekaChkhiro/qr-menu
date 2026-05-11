'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import { Check, Loader2, Lock, Type } from 'lucide-react';

import { Segmented, SegmentedItem } from '@/components/ui/segmented';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/image-upload';
import { useUpdateMenu } from '@/hooks/use-menus';
import { cn } from '@/lib/utils';
import type {
  LogoAlignment,
  LogoSize,
  Menu,
  MenuWithDetails,
} from '@/types/menu';

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

// T20.1 — currency options. Symbols are universal so the right-hand label
// is the only thing that needs to render; codes ride along for context.
const CURRENCY_OPTIONS = [
  { value: '₾', code: 'GEL', label: 'ლარი' },
  { value: '$', code: 'USD', label: 'US Dollar' },
  { value: '€', code: 'EUR', label: 'Euro' },
  { value: '£', code: 'GBP', label: 'Pound Sterling' },
  { value: '₽', code: 'RUB', label: 'Russian Ruble' },
  { value: '₺', code: 'TRY', label: 'Turkish Lira' },
] as const;

const DEFAULT_PRIMARY = '#B8633D';
const DEFAULT_ACCENT = '#F59E0B';
const DEFAULT_CURRENCY = '₾';
const DEFAULT_RADIUS = 12;
const DEFAULT_FONT = 'Inter';

// T20.2 — Layout & Style enums (mirror Prisma + lib/validations/menu.ts).
type MenuTemplate = 'CLASSIC' | 'MAGAZINE' | 'COMPACT';
type MenuLayoutOpt = 'LINEAR' | 'CATEGORIES_FIRST';
type ProductCardStyle = 'BORDERED' | 'ELEVATED' | 'FLAT' | 'MINIMAL';
type ProductTouchEffect = 'SCALE' | 'GLOW' | 'GRADIENT' | 'NONE';

const TEMPLATE_OPTIONS: ReadonlyArray<MenuTemplate> = [
  'CLASSIC',
  'MAGAZINE',
  'COMPACT',
];

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
  const [accentColor, setAccentColor] = useState(
    menu.accentColor || DEFAULT_ACCENT,
  );
  const [cornerRadius, setCornerRadius] = useState(
    menu.cornerRadius ?? DEFAULT_RADIUS,
  );
  const [fontFamily, setFontFamily] = useState(
    menu.headingFont || DEFAULT_FONT,
  );
  const [currencySymbol, setCurrencySymbol] = useState(
    menu.currencySymbol || DEFAULT_CURRENCY,
  );
  const [menuTemplate, setMenuTemplate] = useState<MenuTemplate>(
    (menu.menuTemplate as MenuTemplate | undefined) ?? 'CLASSIC',
  );
  const [menuLayout, setMenuLayout] = useState<MenuLayoutOpt>(
    (menu.menuLayout as MenuLayoutOpt | undefined) ?? 'LINEAR',
  );
  const [productCardStyle, setProductCardStyle] = useState<ProductCardStyle>(
    (menu.productCardStyle as ProductCardStyle | undefined) ?? 'BORDERED',
  );
  const [productTouchEffect, setProductTouchEffect] = useState<ProductTouchEffect>(
    (menu.productTouchEffect as ProductTouchEffect | undefined) ?? 'SCALE',
  );
  const [splitByType, setSplitByType] = useState<boolean>(
    Boolean(menu.splitByType),
  );
  const [logoSize, setLogoSize] = useState<LogoSize>(
    (menu.logoSize as LogoSize | undefined) ?? 'MEDIUM',
  );
  const [logoAlignment, setLogoAlignment] = useState<LogoAlignment>(
    (menu.logoAlignment as LogoAlignment | undefined) ?? 'CENTER',
  );

  // Keep local state in sync if the menu is refetched externally (pusher).
  const prevMenuIdRef = useRef(menu.id);
  useEffect(() => {
    if (prevMenuIdRef.current !== menu.id) {
      prevMenuIdRef.current = menu.id;
      setPrimaryColor(menu.primaryColor || DEFAULT_PRIMARY);
      setAccentColor(menu.accentColor || DEFAULT_ACCENT);
      setCornerRadius(menu.cornerRadius ?? DEFAULT_RADIUS);
      setFontFamily(menu.headingFont || DEFAULT_FONT);
      setCurrencySymbol(menu.currencySymbol || DEFAULT_CURRENCY);
      setMenuTemplate((menu.menuTemplate as MenuTemplate | undefined) ?? 'CLASSIC');
      setMenuLayout((menu.menuLayout as MenuLayoutOpt | undefined) ?? 'LINEAR');
      setProductCardStyle(
        (menu.productCardStyle as ProductCardStyle | undefined) ?? 'BORDERED',
      );
      setProductTouchEffect(
        (menu.productTouchEffect as ProductTouchEffect | undefined) ?? 'SCALE',
      );
      setSplitByType(Boolean(menu.splitByType));
      setLogoSize((menu.logoSize as LogoSize | undefined) ?? 'MEDIUM');
      setLogoAlignment(
        (menu.logoAlignment as LogoAlignment | undefined) ?? 'CENTER',
      );
    }
  }, [
    menu.id,
    menu.primaryColor,
    menu.accentColor,
    menu.cornerRadius,
    menu.headingFont,
    menu.currencySymbol,
    menu.menuTemplate,
    menu.menuLayout,
    menu.productCardStyle,
    menu.productTouchEffect,
    menu.splitByType,
    menu.logoSize,
    menu.logoAlignment,
  ]);

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

  const handleAccentSwatchClick = (color: string) => {
    setAccentColor(color);
    void save({ accentColor: color });
  };

  const handleAccentHexBlur = (value: string) => {
    const normalized = value.startsWith('#') ? value : `#${value}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return;
    setAccentColor(normalized.toUpperCase());
    void save({ accentColor: normalized });
  };

  const handleCurrencyChange = (next: string) => {
    setCurrencySymbol(next);
    void save({ currencySymbol: next });
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

  const handleLogoSizeChange = (next: string) => {
    const value = next as LogoSize;
    if (value === logoSize) return;
    setLogoSize(value);
    void save({ logoSize: value });
  };

  const handleLogoAlignmentChange = (next: string) => {
    const value = next as LogoAlignment;
    if (value === logoAlignment) return;
    setLogoAlignment(value);
    void save({ logoAlignment: value });
  };

  const handleCoverChange = (url: string | null) => {
    void save({ coverImageUrl: url });
  };

  // T20.2 — Layout & Style commit handlers.
  const handleTemplateChange = (next: MenuTemplate) => {
    if (next === menuTemplate) return;
    setMenuTemplate(next);
    void save({ menuTemplate: next });
  };

  const handleMenuLayoutChange = (next: string) => {
    const value = next as MenuLayoutOpt;
    setMenuLayout(value);
    void save({ menuLayout: value });
  };

  const handleCardStyleChange = (next: string) => {
    const value = next as ProductCardStyle;
    setProductCardStyle(value);
    void save({ productCardStyle: value });
  };

  const handleTouchEffectChange = (next: string) => {
    const value = next as ProductTouchEffect;
    setProductTouchEffect(value);
    void save({ productTouchEffect: value });
  };

  const handleSplitByTypeChange = (next: boolean) => {
    setSplitByType(next);
    void save({ splitByType: next });
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

              {/* T21.4 — Size + Alignment segmented controls */}
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-text-muted">
                    {t('logo.size.label')}
                  </div>
                  <Segmented
                    data-testid="branding-logo-size"
                    value={logoSize}
                    onValueChange={handleLogoSizeChange}
                    ariaLabel={t('logo.size.label')}
                  >
                    <SegmentedItem
                      value="SMALL"
                      data-testid="branding-logo-size-small"
                    >
                      {t('logo.size.small')}
                    </SegmentedItem>
                    <SegmentedItem
                      value="MEDIUM"
                      data-testid="branding-logo-size-medium"
                    >
                      {t('logo.size.medium')}
                    </SegmentedItem>
                    <SegmentedItem
                      value="LARGE"
                      data-testid="branding-logo-size-large"
                    >
                      {t('logo.size.large')}
                    </SegmentedItem>
                  </Segmented>
                </div>
                <div>
                  <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.4px] text-text-muted">
                    {t('logo.alignment.label')}
                  </div>
                  <Segmented
                    data-testid="branding-logo-alignment"
                    value={logoAlignment}
                    onValueChange={handleLogoAlignmentChange}
                    ariaLabel={t('logo.alignment.label')}
                  >
                    <SegmentedItem
                      value="LEFT"
                      data-testid="branding-logo-alignment-left"
                    >
                      {t('logo.alignment.left')}
                    </SegmentedItem>
                    <SegmentedItem
                      value="CENTER"
                      data-testid="branding-logo-alignment-center"
                    >
                      {t('logo.alignment.center')}
                    </SegmentedItem>
                    <SegmentedItem
                      value="RIGHT"
                      data-testid="branding-logo-alignment-right"
                    >
                      {t('logo.alignment.right')}
                    </SegmentedItem>
                  </Segmented>
                </div>
              </div>
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
                testId="branding-hex-input"
              />
            </BrandingSection>

            {/* ── Accent color (T20.1) ─────────────────────────────────── */}
            <BrandingSection label={t('accentColor.label')}>
              <div
                className="mb-2 flex gap-[6px]"
                role="radiogroup"
                aria-label={t('accentColor.label')}
              >
                {COLOR_PALETTE.map((color) => {
                  const isSelected =
                    accentColor.toUpperCase() === color.toUpperCase();
                  return (
                    <button
                      key={`accent-${color}`}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={color}
                      data-testid={`branding-accent-swatch-${color.slice(1).toLowerCase()}`}
                      onClick={() => handleAccentSwatchClick(color)}
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
                value={accentColor}
                onChange={setAccentColor}
                onCommit={handleAccentHexBlur}
                testId="branding-accent-hex-input"
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

            {/* ── Currency (T20.1) ─────────────────────────────────────── */}
            <BrandingSection label={t('currency.label')}>
              <Select
                value={currencySymbol}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger
                  data-testid="branding-currency-select"
                  className="h-auto rounded-[8px] border border-border bg-white px-3 py-[9px] text-left"
                >
                  <div className="flex flex-1 items-center gap-[10px]">
                    <span
                      data-testid="branding-currency-symbol"
                      className="font-mono text-[15px] font-semibold text-text-default"
                    >
                      {currencySymbol}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[12px] text-text-muted">
                        {CURRENCY_OPTIONS.find(
                          (c) => c.value === currencySymbol,
                        )?.code ?? ''}{' '}
                        ·{' '}
                        {CURRENCY_OPTIONS.find(
                          (c) => c.value === currencySymbol,
                        )?.label ?? ''}
                      </div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      data-testid={`branding-currency-option-${c.code.toLowerCase()}`}
                    >
                      <span className="mr-2 font-mono text-[14px] font-semibold">
                        {c.value}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {c.code} · {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </BrandingSection>
          </div>
        </BrandingCard>

        {/* ── Layout & Style (T20.2) ────────────────────────────────── */}
        <BrandingCard>
          <div
            data-testid="branding-layout-card"
            className="flex flex-col gap-[18px]"
          >
            <div className="text-[13px] font-semibold text-text-default">
              {t('layout.title')}
            </div>

            {/* Template picker */}
            <BrandingSection label={t('layout.template.label')}>
              <p className="-mt-1 mb-[10px] text-[11.5px] text-text-muted">
                {t('layout.template.description')}
              </p>
              <div
                role="radiogroup"
                aria-label={t('layout.template.label')}
                className="grid grid-cols-3 gap-2"
              >
                {TEMPLATE_OPTIONS.map((tpl) => {
                  const active = menuTemplate === tpl;
                  const labelKey = tpl.toLowerCase() as
                    | 'classic'
                    | 'magazine'
                    | 'compact';
                  return (
                    <button
                      key={tpl}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      data-testid={`branding-template-${tpl.toLowerCase()}`}
                      onClick={() => handleTemplateChange(tpl)}
                      className={cn(
                        'group relative rounded-[10px] border p-[10px] text-left transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                        active
                          ? 'border-text-default bg-card-soft ring-2 ring-text-default/15'
                          : 'border-border bg-card hover:border-text-default/40',
                      )}
                    >
                      {active && (
                        <span className="absolute right-[6px] top-[6px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-text-default text-white">
                          <Check size={11} strokeWidth={2.5} />
                        </span>
                      )}
                      <div className="mb-[8px] h-[64px] overflow-hidden rounded-[6px] bg-bg ring-1 ring-border-soft">
                        <TemplatePreview template={tpl} />
                      </div>
                      <div className="text-[12px] font-semibold text-text-default">
                        {t(`layout.template.${labelKey}.label`)}
                      </div>
                      <div className="text-[10.5px] text-text-muted">
                        {t(`layout.template.${labelKey}.desc`)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </BrandingSection>

            {/* 2×2 grid: Layout / Card style / Touch effect / Foods-Drinks split */}
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <BrandingSection label={t('layout.menuLayout.label')}>
                <Select
                  value={menuLayout}
                  onValueChange={handleMenuLayoutChange}
                >
                  <SelectTrigger
                    data-testid="branding-menu-layout-select"
                    className="rounded-[8px] border border-border bg-white px-3 py-[9px] text-[13px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LINEAR">
                      {t('layout.menuLayout.linear')}
                    </SelectItem>
                    <SelectItem value="CATEGORIES_FIRST">
                      {t('layout.menuLayout.categoriesFirst')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </BrandingSection>

              <BrandingSection label={t('layout.cardStyle.label')}>
                <Select
                  value={productCardStyle}
                  onValueChange={handleCardStyleChange}
                >
                  <SelectTrigger
                    data-testid="branding-card-style-select"
                    className="rounded-[8px] border border-border bg-white px-3 py-[9px] text-[13px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BORDERED">
                      {t('layout.cardStyle.bordered')}
                    </SelectItem>
                    <SelectItem value="ELEVATED">
                      {t('layout.cardStyle.elevated')}
                    </SelectItem>
                    <SelectItem value="FLAT">
                      {t('layout.cardStyle.flat')}
                    </SelectItem>
                    <SelectItem value="MINIMAL">
                      {t('layout.cardStyle.minimal')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </BrandingSection>

              <BrandingSection label={t('layout.touchEffect.label')}>
                <Select
                  value={productTouchEffect}
                  onValueChange={handleTouchEffectChange}
                >
                  <SelectTrigger
                    data-testid="branding-touch-effect-select"
                    className="rounded-[8px] border border-border bg-white px-3 py-[9px] text-[13px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCALE">
                      {t('layout.touchEffect.scale')}
                    </SelectItem>
                    <SelectItem value="GLOW">
                      {t('layout.touchEffect.glow')}
                    </SelectItem>
                    <SelectItem value="GRADIENT">
                      {t('layout.touchEffect.gradient')}
                    </SelectItem>
                    <SelectItem value="NONE">
                      {t('layout.touchEffect.none')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </BrandingSection>

              <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-card-soft px-3 py-[10px]">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-text-default">
                    {t('layout.splitByType.label')}
                  </div>
                  <div className="text-[10.5px] text-text-muted">
                    {t('layout.splitByType.description')}
                  </div>
                </div>
                <Switch
                  data-testid="branding-split-by-type-switch"
                  checked={splitByType}
                  onCheckedChange={handleSplitByTypeChange}
                  aria-label={t('layout.splitByType.label')}
                />
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
  testId = 'branding-hex-input',
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit: (next: string) => void;
  testId?: string;
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
        data-testid={testId}
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

function TemplatePreview({ template }: { template: MenuTemplate }) {
  // Mini previews ported from menu-settings-form.tsx (legacy form lines 213-298).
  if (template === 'CLASSIC') {
    return (
      <div className="flex h-full items-center gap-[6px] p-[6px]">
        <div className="h-6 w-6 shrink-0 rounded bg-text-muted/25" />
        <div className="flex-1 space-y-[4px]">
          <div className="h-[6px] w-2/3 rounded bg-text-muted/60" />
          <div className="h-[4px] w-1/2 rounded bg-text-muted/30" />
        </div>
      </div>
    );
  }
  if (template === 'MAGAZINE') {
    return (
      <div className="space-y-[4px] p-[4px]">
        <div className="h-[20px] w-full rounded bg-text-muted/35" />
        <div className="h-[6px] w-3/4 rounded bg-text-muted/60" />
        <div className="h-[4px] w-1/3 rounded bg-text-muted/30" />
      </div>
    );
  }
  return (
    <div className="space-y-[4px] p-[6px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between gap-1">
          <div className="h-[4px] w-1/2 rounded bg-text-muted/60" />
          <div className="h-[6px] w-[6px] shrink-0 rounded bg-text-muted/30" />
        </div>
      ))}
    </div>
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

