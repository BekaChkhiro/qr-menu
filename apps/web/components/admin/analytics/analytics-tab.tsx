'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import {
  BarChart3,
  Check,
  Copy,
  Download,
  QrCode,
  Sparkles,
} from 'lucide-react';

import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { useMenuAnalytics } from '@/hooks/use-analytics';
import { AnalyticsKpis } from './analytics-kpis';
import { ViewsOverTimeChart } from './views-over-time-chart';
import { TopCategoriesCard } from './top-categories-card';
import { DeviceBreakdownCard } from './device-breakdown-card';
import {
  GeographyPreviewCard,
  HeatmapPreviewCard,
  TopProductsPreviewCard,
  TrafficSourcePreviewCard,
} from './advanced-sections';
import { AnalyticsRangeProvider } from './analytics-range-context';
import { DateRangePicker } from './date-range-picker';

interface AnalyticsTabProps {
  menuId: string;
  menuSlug: string;
  hasAnalytics: boolean;
}

export function AnalyticsTab({
  menuId,
  menuSlug,
  hasAnalytics,
}: AnalyticsTabProps) {
  const { data, isLoading } = useMenuAnalytics(menuId, { period: '30d' });

  if (!hasAnalytics) {
    return <AnalyticsTabFreeLocked menuId={menuId} />;
  }

  const totalViews = data?.overview?.totalViews ?? 0;

  if (!isLoading && totalViews === 0) {
    return <AnalyticsTabEmpty menuId={menuId} menuSlug={menuSlug} />;
  }

  return (
    <AnalyticsRangeProvider>
      <AnalyticsTabContent menuId={menuId} />
    </AnalyticsRangeProvider>
  );
}

// ─── Normal render (PRO, with views) ───────────────────────────────────────

function AnalyticsTabContent({ menuId }: { menuId: string }) {
  return (
    <div data-testid="editor-analytics-tab" className="space-y-4">
      <DateRangePicker />

      <AnalyticsKpis menuId={menuId} hasAnalytics />

      <ViewsOverTimeChart menuId={menuId} hasAnalytics />

      <div
        data-testid="editor-analytics-row-3"
        className="grid gap-4 lg:grid-cols-[2fr_1fr]"
      >
        <TopCategoriesCard menuId={menuId} hasAnalytics />
        <DeviceBreakdownCard menuId={menuId} hasAnalytics />
      </div>

      <HeatmapPreviewCard hasAnalytics />

      <div className="grid gap-4 lg:grid-cols-2">
        <TopProductsPreviewCard menuId={menuId} hasAnalytics />
        <GeographyPreviewCard hasAnalytics />
      </div>

      <TrafficSourcePreviewCard hasAnalytics />
    </div>
  );
}

// ─── FREE-locked (full-page blur + single centered upgrade card) ───────────

function AnalyticsTabFreeLocked({ menuId }: { menuId: string }) {
  const t = useTranslations('admin.editor.analytics.locked');

  return (
    <div
      data-testid="editor-analytics-tab"
      data-plan-locked="true"
      className="relative"
    >
      {/* Blurred ghost layout — rendered for visual texture under the overlay. */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none space-y-4 opacity-55 blur-[5px]"
      >
        <AnalyticsKpis menuId={menuId} hasAnalytics />
        <ViewsOverTimeChart menuId={menuId} hasAnalytics />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <TopCategoriesCard menuId={menuId} hasAnalytics />
          <DeviceBreakdownCard menuId={menuId} hasAnalytics />
        </div>
        <HeatmapPreviewCard hasAnalytics />
        <div className="grid gap-4 lg:grid-cols-2">
          <TopProductsPreviewCard menuId={menuId} hasAnalytics />
          <GeographyPreviewCard hasAnalytics />
        </div>
        <TrafficSourcePreviewCard hasAnalytics />
      </div>

      {/* Scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'hsl(var(--bg) / 0.4)' }}
      />

      {/* Centered upgrade card */}
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-24">
        <div
          role="region"
          aria-label={t('title')}
          data-testid="editor-analytics-free-locked-card"
          className="w-full max-w-[480px] rounded-[16px] border border-border bg-card p-8 text-center shadow-lg"
        >
          <span
            aria-hidden="true"
            className="mx-auto mb-4 inline-flex size-[52px] items-center justify-center rounded-[12px] bg-accent-soft text-accent"
          >
            <BarChart3 size={22} strokeWidth={1.75} />
          </span>

          <h3 className="text-[20px] font-semibold -tracking-[0.4px] text-text-default">
            {t('title')}
          </h3>
          <p className="mx-auto mt-2 max-w-[400px] text-[13.5px] leading-[1.55] text-text-muted">
            {t('body')}
          </p>

          <ul className="mt-5 flex flex-col gap-2 text-left">
            {(['a', 'b', 'c'] as const).map((key) => (
              <li
                key={key}
                className="flex items-center gap-2.5 text-[13px] text-text-default"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] bg-success-soft text-success"
                >
                  <Check size={12} strokeWidth={2.4} />
                </span>
                {t(`bullets.${key}`)}
              </li>
            ))}
          </ul>

          <Link
            data-testid="editor-analytics-upgrade-cta"
            href="/admin/settings/billing"
            className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-text-default px-4 py-[10px] text-[13.5px] font-semibold text-white hover:opacity-90"
          >
            <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" />
            {t('cta')}
          </Link>

          <p className="mt-2.5 text-[11px] text-text-subtle">{t('guarantee')}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state (PRO, 0 views) ────────────────────────────────────────────

function AnalyticsTabEmpty({
  menuId,
  menuSlug,
}: {
  menuId: string;
  menuSlug: string;
}) {
  const t = useTranslations('admin.editor.analytics');
  const tEmpty = useTranslations('admin.editor.analytics.empty');
  const [copying, setCopying] = useState(false);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/m/${menuSlug}`;
    return `${window.location.origin}/m/${menuSlug}`;
  }, [menuSlug]);

  const handleCopyLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(publicUrl);
      toast.success(tEmpty('copyToast'));
    } catch {
      toast.error(tEmpty('copyError'));
    } finally {
      setCopying(false);
    }
  };

  const noDataValue = tEmpty('noDataValue');
  const noDataCaption = tEmpty('noDataCaption');

  return (
    <div
      data-testid="editor-analytics-tab"
      data-empty="true"
      className="space-y-4"
    >
      <section
        data-testid="editor-analytics-empty-card"
        className="rounded-[14px] border border-border bg-card px-6 py-12 text-center"
      >
        <QrRippleIllustration />

        <h2 className="mt-6 text-[20px] font-semibold -tracking-[0.4px] text-text-default">
          {tEmpty('title')}
        </h2>
        <p className="mx-auto mt-2 max-w-[480px] text-[13.5px] leading-[1.55] text-text-muted">
          {tEmpty('body')}
        </p>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="primary" size="md">
            <a
              data-testid="editor-analytics-empty-download-qr"
              href={`/api/qr/${menuId}?format=png&size=medium&download=true`}
              download
            >
              <Download size={14} strokeWidth={1.8} aria-hidden="true" />
              {tEmpty('downloadQr')}
            </a>
          </Button>
          <Button
            data-testid="editor-analytics-empty-copy-link"
            variant="secondary"
            size="md"
            onClick={handleCopyLink}
            disabled={copying}
          >
            <Copy size={14} strokeWidth={1.8} aria-hidden="true" />
            {tEmpty('copyLink')}
          </Button>
        </div>
      </section>

      {/* No-data KPI row — same 4-card grid as the live state but placeholder values */}
      <div
        data-testid="editor-analytics-empty-kpis"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          data-testid="kpi-total-views"
          label={t('kpis.totalViews')}
          value={noDataValue}
          delta={noDataCaption}
          tone="flat"
        />
        <StatCard
          data-testid="kpi-unique-scans"
          label={t('kpis.uniqueScans')}
          value={noDataValue}
          delta={noDataCaption}
          tone="flat"
        />
        <StatCard
          data-testid="kpi-avg-time"
          label={t('kpis.avgTimeOnMenu')}
          value={noDataValue}
          delta={noDataCaption}
          tone="flat"
        />
        <StatCard
          data-testid="kpi-peak-hour"
          label={t('kpis.peakHour')}
          value={noDataValue}
          delta={noDataCaption}
          tone="flat"
        />
      </div>
    </div>
  );
}

// Three concentric accent rings with a centered QR chip. Matches the
// design's 140×140 ripple from `qr-menu-design/components/analytics-page.jsx:825`.
function QrRippleIllustration() {
  return (
    <div
      aria-hidden="true"
      data-testid="editor-analytics-empty-illustration"
      className="relative mx-auto size-[140px]"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border-[1.5px] border-accent"
          style={{
            opacity: 0.08 + i * 0.08,
            transform: `scale(${1 + i * 0.12})`,
          }}
        />
      ))}
      <div className="absolute inset-[26px] flex items-center justify-center rounded-[10px] border border-border bg-white">
        <QrCode size={40} strokeWidth={1.5} className="text-accent" />
      </div>
    </div>
  );
}

