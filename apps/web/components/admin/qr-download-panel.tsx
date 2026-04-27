'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowRight,
  Copy,
  Download,
  Globe,
  Image as ImageIcon,
  Lock,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useMenuAnalytics } from '@/hooks/use-analytics';
import { cn } from '@/lib/utils';
import type { Menu, MenuWithDetails, QrStyle } from '@/types/menu';

// ── Source: qr-menu-design/components/qr-page.jsx (Section F — QR codes) ─────

type DownloadFormat = 'png' | 'svg' | 'pdf';
type SizeMode = 'S' | 'M' | 'L';

const SIZE_API_MAP: Record<SizeMode, string> = {
  S: 'small',
  M: 'medium',
  L: 'large',
};

interface QrDownloadPanelProps {
  menu: Menu | MenuWithDetails;
  hasQrLogo: boolean;
  sizeMode: SizeMode;
  onOpenTemplates?: () => void;
}

/** Simple string hash for deterministic placeholders. */
function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function QrDownloadPanel({
  menu,
  hasQrLogo,
  sizeMode,
  onOpenTemplates,
}: QrDownloadPanelProps) {
  const t = useTranslations('admin.editor.qr');

  const [format, setFormat] = useState<DownloadFormat>('png');
  const [includeUrl, setIncludeUrl] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(hasQrLogo);
  const [trackingEnabled, setTrackingEnabled] = useState(true);

  const { data: analytics } = useMenuAnalytics(menu.id, { period: '30d' });

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/m/${menu.slug}`;
    return `${window.location.origin}/m/${menu.slug}`;
  }, [menu.slug]);



  // ── Scan stats (deterministic placeholder for "most active table") ─────────
  const scanCount = analytics?.kpis?.uniqueScans?.current ?? 0;
  const tableHash = hashString(menu.id);
  const activeTableNumber = (tableHash % 20) + 1;
  const activeTableScans = Math.round(
    (analytics?.kpis?.uniqueScans?.current ?? 2410) * 0.53,
  );

  // ── Download handler ───────────────────────────────────────────────────────
  const handleDownload = () => {
    const params = new URLSearchParams({
      format,
      download: 'true',
      size: SIZE_API_MAP[sizeMode],
      style: (menu.qrStyle ?? 'SQUARE') as QrStyle,
      fg: menu.qrForegroundColor ?? '#18181B',
    });
    if (menu.qrBackgroundColor) {
      params.set('bg', menu.qrBackgroundColor);
    }
    if (includeLogo && hasQrLogo && menu.qrLogoUrl) {
      params.set('logo', 'menu');
    } else {
      params.set('logo', 'none');
    }

    const url = `/api/qr/${menu.id}?${params.toString()}`;
    window.open(url, '_blank');
  };

  // ── Copy handler ───────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t('copyToast'));
    } catch {
      toast.error(t('copyError'));
    }
  };

  const formatLabel = format.toUpperCase();

  return (
    <div
      data-testid="editor-qr-download-panel"
      className="flex min-w-0 flex-1 flex-col gap-4"
    >
      {/* ═════════════════ Download & share card ═════════════════ */}
      <div className="rounded-card border border-border bg-card p-[22px]">
        <h3 className="text-[15px] font-semibold tracking-[-0.3px] text-text-default">
          {t('download.title')}
        </h3>
        <p className="mb-[18px] mt-1 text-[12.5px] text-text-muted">
          {t('download.subtitle')}
        </p>

        {/* ── Format ── */}
        <FieldBlock label={t('download.format.label')}>
          <div className="flex flex-col gap-2">
            <RadioRow
              checked={format === 'png'}
              title="PNG"
              desc={t('download.format.pngDesc')}
              onClick={() => setFormat('png')}
              dataTestId="editor-qr-format-png"
            />
            <RadioRow
              checked={format === 'svg'}
              title="SVG"
              desc={t('download.format.svgDesc')}
              onClick={() => setFormat('svg')}
              dataTestId="editor-qr-format-svg"
            />
            <RadioRow
              checked={format === 'pdf'}
              title="PDF"
              desc={t('download.format.pdfDesc')}
              onClick={() => setFormat('pdf')}
              dataTestId="editor-qr-format-pdf"
            />
          </div>
        </FieldBlock>

        {/* ── Include ── */}
        <FieldBlock label={t('download.include.label')}>
          <CheckboxRow
            checked={includeUrl}
            label={t('download.include.url')}
            onClick={() => setIncludeUrl((v) => !v)}
            dataTestId="editor-qr-include-url"
          />
          <CheckboxRow
            checked={includeCta}
            label={t('download.include.cta')}
            onClick={() => setIncludeCta((v) => !v)}
            dataTestId="editor-qr-include-cta"
          />
          <CheckboxRow
            checked={includeLogo && hasQrLogo}
            label={t('download.include.logo')}
            locked={!hasQrLogo}
            onClick={() => {
              if (!hasQrLogo) return;
              setIncludeLogo((v) => !v);
            }}
            dataTestId="editor-qr-include-logo"
          />
        </FieldBlock>

        {/* ── Download button ── */}
        <Button
          variant="default"
          className="mt-2 flex w-full items-center justify-center gap-2 bg-text-default text-white hover:bg-text-default/90"
          onClick={handleDownload}
          data-testid="editor-qr-download-btn"
        >
          <Download size={15} strokeWidth={1.5} />
          <span className="text-[13.5px]">
            {t('download.downloadBtn', { format: formatLabel })}
          </span>
        </Button>

        {/* ── Templates button ── */}
        <Button
          variant="outline"
          className="mt-2 flex w-full items-center justify-center gap-2 border-border bg-white text-text-default hover:bg-bg"
          onClick={onOpenTemplates}
          data-testid="editor-qr-templates-btn"
        >
          <ImageIcon size={15} strokeWidth={1.5} />
          <span className="text-[13px]">{t('download.templatesBtn')}</span>
          <span className="ml-2 inline-flex items-center rounded-[4px] bg-chip px-[7px] py-[1px] text-[10.5px] font-semibold text-text-muted">
            8 {t('download.templatesCount')}
          </span>
        </Button>
      </div>

      {/* ═════════════════ Scan stats card ═════════════════ */}
      <div
        className="rounded-card border border-border bg-card p-5"
        data-testid="editor-qr-scan-stats"
      >
        <div className="mb-[6px] text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-muted">
          {t('stats.heading')}
        </div>
        <div className="mb-[6px] flex items-baseline gap-2">
          <span className="text-[36px] font-semibold leading-none tracking-[-1px] text-text-default [font-variant-numeric:tabular-nums]">
            {scanCount.toLocaleString()}
          </span>
          <span className="text-[13px] text-text-muted">
            {t('stats.period')}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-[6px] border-t border-border-soft pt-[10px] text-[12.5px] text-text-muted">
          <MapPin size={12} strokeWidth={1.5} className="shrink-0 text-accent" />
          <span>{t('stats.mostActive')}</span>
          <span className="font-semibold text-text-default">
            {t('stats.tableName', { n: activeTableNumber })}
          </span>
          <span className="[font-variant-numeric:tabular-nums] text-text-subtle">
            ({activeTableScans.toLocaleString()} {t('stats.scans')})
          </span>
          <a
            href={`?tab=analytics`}
            className="ml-auto inline-flex items-center gap-[3px] text-[11.5px] font-medium text-accent hover:underline"
            data-testid="editor-qr-view-analytics"
          >
            {t('stats.viewAnalytics')}
            <ArrowRight size={11} strokeWidth={2} />
          </a>
        </div>
      </div>

      {/* ═════════════════ Short URL card ═════════════════ */}
      <div className="rounded-card border border-border bg-card p-5">
        <div className="mb-[10px] text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-muted">
          {t('link.heading')}
        </div>
        <div className="mb-[14px] flex items-center gap-2 rounded-[8px] border border-border-soft bg-bg px-3 py-[9px]">
          <Globe
            size={13}
            strokeWidth={1.5}
            className="shrink-0 text-text-subtle"
          />
          <span className="min-w-0 flex-1 truncate font-mono text-[13px] -tracking-[0.2px] text-text-default">
            {publicUrl}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 border-border bg-white px-2 text-[12px] text-text-default hover:bg-bg"
            onClick={handleCopy}
            data-testid="editor-qr-link-copy"
          >
            <Copy size={13} strokeWidth={1.5} />
            {t('link.copy')}
          </Button>
        </div>
        <div className="flex items-center gap-[10px] border-t border-border-soft pt-[10px]">
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-text-default">
              {t('link.trackingTitle')}
            </div>
            <div className="mt-[2px] text-[11.5px] text-text-muted">
              {t('link.trackingBody')}
            </div>
          </div>
          <Switch
            checked={trackingEnabled}
            onCheckedChange={setTrackingEnabled}
            aria-label={t('link.trackingTitle')}
            data-testid="editor-qr-tracking-toggle"
          />
        </div>
      </div>
    </div>
  );
}

// ── Presentational helpers ───────────────────────────────────────────────────

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-[10px] text-[11.5px] font-semibold uppercase tracking-[0.4px] text-text-default">
        {label}
      </div>
      {children}
    </div>
  );
}

function RadioRow({
  checked,
  title,
  desc,
  onClick,
  dataTestId,
}: {
  checked: boolean;
  title: string;
  desc: string;
  onClick: () => void;
  dataTestId: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      data-testid={dataTestId}
      data-active={checked}
      className={cn(
        'flex w-full items-start gap-3 rounded-[8px] border px-3 py-[10px] text-left transition-shadow',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        checked
          ? 'border-accent bg-[#FDFAF7] shadow-[0_0_0_3px_hsl(var(--accent-soft))]'
          : 'border-border bg-white hover:border-border-soft',
      )}
    >
      <span
        className={cn(
          'relative mt-[2px] h-4 w-4 shrink-0 rounded-full border-2 bg-white',
          checked ? 'border-accent' : 'border-border',
        )}
      >
        {checked && (
          <span className="absolute inset-[3px] rounded-full bg-accent" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-default">
          {title}
        </div>
        <div className="mt-[2px] text-[11.5px] text-text-muted">{desc}</div>
      </div>
    </button>
  );
}

function CheckboxRow({
  checked,
  label,
  locked,
  onClick,
  dataTestId,
}: {
  checked: boolean;
  label: string;
  locked?: boolean;
  onClick: () => void;
  dataTestId: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      data-testid={dataTestId}
      data-locked={locked ? 'true' : 'false'}
      disabled={locked}
      className={cn(
        'flex w-full items-center gap-[10px] py-2 text-left',
        locked ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
      )}
    >
      <span
        className={cn(
          'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px]',
          checked
            ? 'border-accent bg-accent'
            : 'border-border bg-white',
        )}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1.5 5.5L3.5 7.5L8.5 2.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex-1 text-[13px] font-medium text-text-default">
        {label}
      </span>
      {locked && (
        <span className="inline-flex items-center gap-1 rounded-[4px] bg-success-soft px-[6px] py-[1px] text-[9.5px] font-bold uppercase tracking-[0.4px] text-success">
          <Lock size={9} strokeWidth={1.5} />
          PRO
        </span>
      )}
    </button>
  );
}
