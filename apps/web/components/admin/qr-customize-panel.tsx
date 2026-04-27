'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, Copy, Globe, Image as ImageIcon, Loader2, Lock } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Segmented, SegmentedItem } from '@/components/ui/segmented';
import { useUpdateMenu } from '@/hooks/use-menus';
import { cn } from '@/lib/utils';
import type { Menu, MenuWithDetails, QrStyle } from '@/types/menu';

// ── Source: qr-menu-design/components/qr-page.jsx (Section F — QR codes) ─────

const STYLES: ReadonlyArray<{ value: QrStyle; key: 'classic' | 'rounded' | 'dots' }> = [
  { value: 'SQUARE', key: 'classic' },
  { value: 'ROUNDED', key: 'rounded' },
  { value: 'DOTS', key: 'dots' },
] as const;

// 4 swatches per design — Slate / Terracotta / Black / Navy.
const PALETTE: ReadonlyArray<{ hex: string; key: 'slate' | 'terracotta' | 'black' | 'navy' }> = [
  { hex: '#18181B', key: 'slate' },
  { hex: '#B8633D', key: 'terracotta' },
  { hex: '#000000', key: 'black' },
  { hex: '#1E3A5F', key: 'navy' },
] as const;

type BgMode = 'white' | 'transparent';
type SizeMode = 'S' | 'M' | 'L';

const DEFAULT_FG = '#18181B';
const DEFAULT_BG_HEX = '#FFFFFF';

interface QrCustomizePanelProps {
  menu: Menu | MenuWithDetails;
  /** `hasFeature('qrWithLogo')` — PRO only. */
  hasQrLogo: boolean;
  /** Controlled size mode (defaults to 'M' when uncontrolled). */
  sizeMode?: SizeMode;
  onSizeChange?: (mode: SizeMode) => void;
}

export function QrCustomizePanel({
  menu,
  hasQrLogo,
  sizeMode: controlledSize,
  onSizeChange,
}: QrCustomizePanelProps) {
  const t = useTranslations('admin.editor.qr');
  const updateMenu = useUpdateMenu(menu.id);

  // ── Local state driving the preview ────────────────────────────────────────
  const [style, setStyle] = useState<QrStyle>(menu.qrStyle || 'SQUARE');
  const [fg, setFg] = useState(menu.qrForegroundColor || DEFAULT_FG);
  const [bg, setBg] = useState<BgMode>(
    menu.qrBackgroundColor === null ? 'transparent' : 'white',
  );
  const [useLogo, setUseLogo] = useState(
    hasQrLogo ? Boolean(menu.qrLogoUrl) : false,
  );
  // Size is not persisted — it's a download-only preference (T15.11 wires it).
  const [internalSize, setInternalSize] = useState<SizeMode>('M');
  const sizeMode = controlledSize ?? internalSize;
  const setSizeMode = (m: SizeMode) => {
    setInternalSize(m);
    onSizeChange?.(m);
  };

  // Keep local state in sync when the menu id changes (navigation between menus).
  const prevMenuIdRef = useRef(menu.id);
  useEffect(() => {
    if (prevMenuIdRef.current !== menu.id) {
      prevMenuIdRef.current = menu.id;
      setStyle(menu.qrStyle || 'SQUARE');
      setFg(menu.qrForegroundColor || DEFAULT_FG);
      setBg(menu.qrBackgroundColor === null ? 'transparent' : 'white');
      setUseLogo(hasQrLogo ? Boolean(menu.qrLogoUrl) : false);
    }
  }, [menu.id, menu.qrStyle, menu.qrForegroundColor, menu.qrBackgroundColor, menu.qrLogoUrl, hasQrLogo]);

  // ── Persistence helpers ────────────────────────────────────────────────────

  const save = async (patch: Parameters<typeof updateMenu.mutateAsync>[0]) => {
    try {
      await updateMenu.mutateAsync(patch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    }
  };

  const handleStyleChange = (next: QrStyle) => {
    setStyle(next);
    void save({ qrStyle: next });
  };

  const handleSwatchClick = (hex: string) => {
    setFg(hex);
    void save({ qrForegroundColor: hex });
  };

  const handleHexCommit = (raw: string) => {
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return;
    const upper = normalized.toUpperCase();
    setFg(upper);
    void save({ qrForegroundColor: upper });
  };

  const handleBgChange = (next: string) => {
    const bgNext = next as BgMode;
    setBg(bgNext);
    void save({ qrBackgroundColor: bgNext === 'white' ? DEFAULT_BG_HEX : null });
  };

  const handleLogoToggle = (next: boolean) => {
    if (!hasQrLogo) return;
    setUseLogo(next);
    void save({ qrLogoUrl: next ? menu.logoUrl ?? null : null });
  };

  // ── Preview URL (deterministic, derived from slug) ─────────────────────────

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/m/${menu.slug}`;
    return `${window.location.origin}/m/${menu.slug}`;
  }, [menu.slug]);

  const shortUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/m/${menu.slug}`;
    const host = window.location.host.replace(/^www\./, '');
    return `${host}/m/${menu.slug}`;
  }, [menu.slug]);

  const bgFill = bg === 'white' ? '#FFFFFF' : 'transparent';
  const effectiveLogo = useLogo && hasQrLogo ? menu.logoUrl ?? null : null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCopyUrl = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t('copyToast'));
    } catch {
      toast.error(t('copyError'));
    }
  };

  return (
    <section
      data-testid="editor-qr-tab"
      data-qr-style={style}
      data-qr-bg={bg}
      data-qr-size={sizeMode}
      data-qr-logo={effectiveLogo ? 'true' : 'false'}
      className="relative flex w-full max-w-[600px] shrink-0 flex-col gap-[22px] rounded-card border border-border bg-card p-9"
    >
      {/* ── Giant QR preview ─────────────────────────────────────────────── */}
      <div
        data-testid="editor-qr-preview"
        className={cn(
          'rounded-[12px] border border-border-soft p-2',
          bg === 'transparent'
            ? 'bg-[conic-gradient(at_50%_50%,#f4f3ef_25%,#fff_0,#fff_50%,#f4f3ef_0,#f4f3ef_75%,#fff_0)] [background-size:16px_16px]'
            : 'bg-white',
        )}
      >
        <QrSvg
          url={publicUrl}
          size={320}
          fg={fg}
          bg={bgFill}
          style={style}
          logoUrl={effectiveLogo}
          data-testid="editor-qr-preview-svg"
        />
      </div>

      {/* ── URL chip ──────────────────────────────────────────────────────── */}
      <div
        data-testid="editor-qr-url-chip"
        className="flex items-center gap-2 rounded-[8px] border border-border-soft bg-bg px-[14px] py-[9px]"
      >
        <Globe size={13} strokeWidth={1.5} className="shrink-0 text-text-subtle" />
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] -tracking-[0.2px] text-text-default">
          {shortUrl}
        </span>
        <button
          type="button"
          onClick={handleCopyUrl}
          aria-label={t('copyAriaLabel')}
          data-testid="editor-qr-url-copy"
          className="rounded-[4px] p-1 text-text-muted transition-colors hover:bg-chip hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
        >
          <Copy size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Controls (divided by top border) ──────────────────────────────── */}
      <div className="flex flex-col gap-[18px] border-t border-border-soft pt-[22px]">
        {/* Style */}
        <Field label={t('style.label')}>
          <div
            role="radiogroup"
            aria-label={t('style.label')}
            data-testid="editor-qr-style-group"
            className="flex gap-[10px]"
          >
            {STYLES.map(({ value, key }) => {
              const active = style === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleStyleChange(value)}
                  data-testid={`editor-qr-style-${key}`}
                  data-active={active}
                  className={cn(
                    'group flex flex-1 flex-col items-center gap-2 rounded-[8px] border bg-white px-[10px] py-3 transition-shadow',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                    active
                      ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]'
                      : 'border-border hover:border-border-soft',
                  )}
                >
                  <div className="overflow-hidden rounded-[5px]">
                    <QrSvg
                      url={publicUrl}
                      size={44}
                      fg={fg}
                      bg={bgFill === 'transparent' ? '#FFFFFF' : bgFill}
                      style={value}
                      logoUrl={null}
                      decorative
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[11.5px]',
                      active ? 'font-semibold text-text-default' : 'font-medium text-text-muted',
                    )}
                  >
                    {t(`style.${key}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Foreground color */}
        <Field label={t('foreground.label')}>
          <div className="mb-[10px] flex items-center gap-[12px]">
            <HexInput value={fg} onCommit={handleHexCommit} />
            <div
              role="radiogroup"
              aria-label={t('foreground.palette')}
              data-testid="editor-qr-palette"
              className="flex gap-[6px]"
            >
              {PALETTE.map(({ hex, key }) => {
                const active = fg.toUpperCase() === hex.toUpperCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={t(`foreground.${key}`)}
                    onClick={() => handleSwatchClick(hex)}
                    data-testid={`editor-qr-swatch-${key}`}
                    data-active={active}
                    className={cn(
                      'relative h-[28px] w-[28px] rounded-[6px] transition-shadow',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                      active ? 'border-2 border-text-default' : 'border border-border-soft',
                    )}
                    style={{ background: hex }}
                  >
                    {active && (
                      <span className="absolute -right-1 -top-1 inline-flex h-[14px] w-[14px] items-center justify-center rounded-full bg-text-default text-white">
                        <Check size={9} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label={t('background.label')}>
            <Segmented
              value={bg}
              onValueChange={handleBgChange}
              ariaLabel={t('background.label')}
              data-testid="editor-qr-bg"
            >
              <SegmentedItem value="white" data-testid="editor-qr-bg-white">
                {t('background.white')}
              </SegmentedItem>
              <SegmentedItem value="transparent" data-testid="editor-qr-bg-transparent">
                {t('background.transparent')}
              </SegmentedItem>
            </Segmented>
          </Field>

          <Field label={t('size.label')}>
            <Segmented
              value={sizeMode}
              onValueChange={(v) => setSizeMode(v as SizeMode)}
              ariaLabel={t('size.label')}
              data-testid="editor-qr-size"
            >
              <SegmentedItem value="S" data-testid="editor-qr-size-s">
                {t('size.s')}
              </SegmentedItem>
              <SegmentedItem value="M" data-testid="editor-qr-size-m">
                {t('size.m')}
              </SegmentedItem>
              <SegmentedItem value="L" data-testid="editor-qr-size-l">
                {t('size.l')}
              </SegmentedItem>
            </Segmented>
          </Field>
        </div>

        {/* Add logo row */}
        <div
          data-testid="editor-qr-logo-row"
          data-plan-locked={!hasQrLogo ? 'true' : 'false'}
          className={cn(
            'flex items-center gap-3 rounded-[8px] border border-border px-[14px] py-[10px]',
            hasQrLogo ? 'bg-card' : 'bg-bg opacity-85',
          )}
        >
          <ImageIcon
            size={15}
            strokeWidth={1.5}
            className={hasQrLogo ? 'text-accent' : 'text-text-subtle'}
          />
          <div className="flex-1">
            <div className="flex items-center gap-[6px] text-[13px] font-semibold text-text-default">
              {t('logo.title')}
              {!hasQrLogo && (
                <Lock size={11} strokeWidth={1.5} className="text-text-subtle" />
              )}
            </div>
            <p className="mt-[1px] text-[11.5px] text-text-muted">{t('logo.body')}</p>
          </div>
          {hasQrLogo ? (
            <Switch
              checked={useLogo}
              onCheckedChange={handleLogoToggle}
              aria-label={t('logo.title')}
              data-testid="editor-qr-logo-toggle"
            />
          ) : (
            <span
              data-testid="editor-qr-logo-pro-badge"
              className="inline-flex items-center rounded-[4px] bg-success-soft px-[7px] py-[2px] text-[9.5px] font-bold uppercase tracking-[0.4px] text-success"
            >
              {t('logo.proBadge')}
            </span>
          )}
        </div>
      </div>

      {/* Saving indicator (tucked to top-right of the card) */}
      {updateMenu.isPending && (
        <div
          role="status"
          aria-live="polite"
          data-testid="editor-qr-saving"
          className="pointer-events-none absolute right-4 top-4 flex items-center gap-[6px] rounded-[7px] bg-card px-[10px] py-[6px] text-[11.5px] text-text-muted shadow-xs ring-1 ring-border"
        >
          <Loader2 size={12} className="animate-spin" />
          {t('saving')}
        </div>
      )}
    </section>
  );
}

// ── QrSvg — client-side deterministic QR renderer ─────────────────────────────
// Uses `qrcode` npm package's browser build (QRCode.create) to produce the real
// module matrix, then renders each module as <rect>, rounded <rect>, or
// <circle> per the selected style. A centered logo — when provided — replaces
// the modules underneath with a white plate + embedded <image>; if no logo URL
// is passed while `logoUrl` is truthy we fall back to a "CL"-style placeholder
// to match qr-menu-design/components/qr-page.jsx.
//
// Keeping this inline here (not in lib/qr/) because this file is the only
// consumer; T15.11 will reuse via the existing server endpoint for downloads.

interface QrSvgProps {
  url: string;
  size?: number;
  fg?: string;
  bg?: string; // '#hex' or 'transparent'
  style?: QrStyle;
  logoUrl?: string | null;
  /** Skip the aria-label + role="img" since the parent labels it. */
  decorative?: boolean;
  'data-testid'?: string;
}

function QrSvg({
  url,
  size = 320,
  fg = DEFAULT_FG,
  bg = DEFAULT_BG_HEX,
  style = 'SQUARE',
  logoUrl,
  decorative,
  ...rest
}: QrSvgProps) {
  const matrix = useMemo(() => {
    try {
      const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
      return qr.modules;
    } catch {
      return null;
    }
  }, [url]);

  if (!matrix) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role={decorative ? 'presentation' : 'img'}
        aria-hidden={decorative || undefined}
        {...rest}
      >
        <rect width={size} height={size} fill={bg === 'transparent' ? '#FFFFFF' : bg} />
      </svg>
    );
  }

  const moduleCount = matrix.size;
  const cell = size / moduleCount;

  const logoBoxSize = logoUrl ? Math.round(size * 0.22) : 0;
  const logoBox = logoUrl
    ? {
        x: (size - logoBoxSize) / 2,
        y: (size - logoBoxSize) / 2,
        w: logoBoxSize,
        h: logoBoxSize,
      }
    : null;

  const inLogoArea = (r: number, c: number): boolean => {
    if (!logoBox) return false;
    const x = c * cell + cell / 2;
    const y = r * cell + cell / 2;
    const px = logoBox.x - 2;
    const py = logoBox.y - 2;
    return (
      x >= px &&
      x <= logoBox.x + logoBox.w + 2 &&
      y >= py &&
      y <= logoBox.y + logoBox.h + 2
    );
  };

  const isFinderCell = (r: number, c: number): boolean => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= moduleCount - 7) return true;
    if (r >= moduleCount - 7 && c < 7) return true;
    return false;
  };

  // Emit per-module marks for data cells.
  const dataCells: React.ReactNode[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (!matrix.get(c, r)) continue;
      if (isFinderCell(r, c)) continue;
      if (inLogoArea(r, c)) continue;
      const x = c * cell;
      const y = r * cell;
      if (style === 'DOTS') {
        dataCells.push(
          <circle
            key={`${r}-${c}`}
            cx={x + cell / 2}
            cy={y + cell / 2}
            r={cell * 0.42}
            fill={fg}
          />,
        );
      } else if (style === 'ROUNDED') {
        dataCells.push(
          <rect
            key={`${r}-${c}`}
            x={x}
            y={y}
            width={cell}
            height={cell}
            rx={cell * 0.3}
            ry={cell * 0.3}
            fill={fg}
          />,
        );
      } else {
        dataCells.push(
          <rect
            key={`${r}-${c}`}
            x={x}
            y={y}
            width={cell}
            height={cell}
            fill={fg}
          />,
        );
      }
    }
  }

  // Finder corners (TL, TR, BL): outer 7×7 ring, inner 5×5 blank, inner 3×3 fill.
  const finderCorners: Array<[number, number]> = [
    [0, 0],
    [0, moduleCount - 7],
    [moduleCount - 7, 0],
  ];
  const outerR =
    style === 'ROUNDED' ? cell * 1.6 : style === 'DOTS' ? cell * 1.4 : 0;
  const innerR =
    style === 'ROUNDED' ? cell * 0.8 : style === 'DOTS' ? cell : 0;
  const midR = style === 'ROUNDED' ? cell * 1.2 : 0;

  const finders = finderCorners.map(([fr, fc], i) => {
    const ox = fc * cell;
    const oy = fr * cell;
    // Solid light "cut-out" so the ring stays visible regardless of data cells.
    const ringLightFill = bg === 'transparent' ? '#FFFFFF' : bg;
    return (
      <g key={`finder-${i}`}>
        <rect
          x={ox}
          y={oy}
          width={cell * 7}
          height={cell * 7}
          fill={fg}
          rx={outerR}
          ry={outerR}
        />
        <rect
          x={ox + cell}
          y={oy + cell}
          width={cell * 5}
          height={cell * 5}
          fill={ringLightFill}
          rx={midR}
          ry={midR}
        />
        <rect
          x={ox + cell * 2}
          y={oy + cell * 2}
          width={cell * 3}
          height={cell * 3}
          fill={fg}
          rx={innerR}
          ry={innerR}
        />
      </g>
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `QR code for ${url}`}
      style={{ display: 'block' }}
      {...rest}
    >
      {bg !== 'transparent' && (
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={bg}
          rx={style === 'ROUNDED' ? 12 : 0}
          ry={style === 'ROUNDED' ? 12 : 0}
        />
      )}
      {finders}
      {dataCells}
      {logoBox && (
        <g>
          <rect
            x={logoBox.x - 4}
            y={logoBox.y - 4}
            width={logoBox.w + 8}
            height={logoBox.h + 8}
            fill="#FFFFFF"
            rx={10}
            ry={10}
          />
          {logoUrl && logoUrl !== 'placeholder' ? (
            <>
              {/* Use Next.js Image not possible inside SVG — fallback to plain <image>. */}
              <image
                href={logoUrl}
                x={logoBox.x}
                y={logoBox.y}
                width={logoBox.w}
                height={logoBox.h}
                preserveAspectRatio="xMidYMid meet"
              />
            </>
          ) : (
            <>
              <rect
                x={logoBox.x}
                y={logoBox.y}
                width={logoBox.w}
                height={logoBox.h}
                fill={fg}
                rx={8}
                ry={8}
              />
              <text
                x={logoBox.x + logoBox.w / 2}
                y={logoBox.y + logoBox.h / 2 + size * 0.035}
                textAnchor="middle"
                fontSize={size * 0.085}
                fontWeight={700}
                fontFamily="Inter, sans-serif"
                fill="#FFFFFF"
                letterSpacing="-1"
              >
                CL
              </text>
            </>
          )}
        </g>
      )}
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-[10px] text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
        {label}
      </div>
      {children}
    </div>
  );
}

function HexInput({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value.replace(/^#/, '').toUpperCase());
  useEffect(() => {
    setDraft(value.replace(/^#/, '').toUpperCase());
  }, [value]);

  return (
    <label className="inline-flex items-center gap-2 rounded-[7px] border border-border bg-white py-[5px] pl-[5px] pr-[8px]">
      <span
        className="h-[22px] w-[22px] rounded-[5px] border border-border-soft"
        style={{ background: value }}
        aria-hidden="true"
      />
      <input
        data-testid="editor-qr-hex-input"
        type="text"
        value={draft}
        maxLength={6}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
          setDraft(next);
        }}
        onBlur={() => onCommit(`#${draft}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onCommit(`#${draft}`);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-[72px] bg-transparent font-mono text-[12px] text-text-default outline-none"
        aria-label="Hex color"
      />
    </label>
  );
}

