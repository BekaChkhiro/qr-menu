'use client';

import { useMemo } from 'react';
import { Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Plan } from '@prisma/client';

import {
  useUserAnalytics,
  type UserAnalyticsDevice,
  type UserAnalyticsPeriod,
} from '@/hooks/use-user-analytics';

interface DashboardDeviceBreakdownProps {
  plan: Plan;
  /** Match the period the AnalyticsCard is showing so both cards stay in lock-step. */
  period?: UserAnalyticsPeriod;
}

// Stroke colors picked from `dashboard-top.jsx:DonutChart.data`. These two
// (Mobile slate, Tablet sand) are not in `docs/design-tokens.md` because the
// donut needs high-contrast categorical colors; Desktop re-uses `accent`.
const DEVICE_COLOR: Record<UserAnalyticsDevice, string> = {
  mobile: '#3B4254',
  desktop: 'hsl(var(--accent))',
  tablet: '#C9B28A',
  other: 'hsl(var(--text-subtle))',
};

const DEVICE_ORDER: UserAnalyticsDevice[] = ['mobile', 'desktop', 'tablet', 'other'];

const DONUT_R = 58;
const DONUT_CX = 72;
const DONUT_CY = 72;
const DONUT_STROKE = 16;

interface DonutChartProps {
  data: Array<{ device: UserAnalyticsDevice; percentage: number; color: string }>;
  centerLabel: string;
  centerValue: string;
}

function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  const c = 2 * Math.PI * DONUT_R;
  const segments = useMemo(() => {
    let offset = 0;
    return data.map((d) => {
      const len = (d.percentage / 100) * c;
      const seg = {
        device: d.device,
        color: d.color,
        dashArray: `${len} ${c - len}`,
        dashOffset: -offset,
      };
      // 2px visual gap between adjacent segments so they don't blur together.
      offset += len + (len > 0 ? 2 : 0);
      return seg;
    });
  }, [data, c]);

  return (
    <svg
      width="144"
      height="144"
      viewBox="0 0 144 144"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <circle
        cx={DONUT_CX}
        cy={DONUT_CY}
        r={DONUT_R}
        fill="none"
        stroke="hsl(var(--chip))"
        strokeWidth={DONUT_STROKE}
      />
      {segments.map((s) => (
        <circle
          key={s.device}
          cx={DONUT_CX}
          cy={DONUT_CY}
          r={DONUT_R}
          fill="none"
          stroke={s.color}
          strokeWidth={DONUT_STROKE}
          strokeDasharray={s.dashArray}
          strokeDashoffset={s.dashOffset}
          transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
          strokeLinecap="butt"
        />
      ))}
      <text
        x={DONUT_CX}
        y={DONUT_CY - 2}
        textAnchor="middle"
        fontSize="11"
        fill="hsl(var(--text-muted))"
        fontFamily="inherit"
      >
        {centerLabel}
      </text>
      <text
        x={DONUT_CX}
        y={DONUT_CY + 14}
        textAnchor="middle"
        fontSize="18"
        fontWeight="600"
        fill="hsl(var(--text))"
        fontFamily="inherit"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {centerValue}
      </text>
    </svg>
  );
}

export function DashboardDeviceBreakdown({
  plan,
  period = '30d',
}: DashboardDeviceBreakdownProps) {
  const t = useTranslations('admin.dashboard.deviceBreakdown');
  const locked = plan === 'FREE';
  const { data, isLoading } = useUserAnalytics(period);

  // Build a full, ordered list so the legend rows are stable even when a
  // bucket is empty. The API drops the "other" row when zero — we add it
  // back as 0% so the DOM shape stays predictable for tests.
  const rows = useMemo(() => {
    const byDevice = new Map(data?.deviceBreakdown.map((d) => [d.device, d]) ?? []);
    return DEVICE_ORDER.map((device) => {
      const row = byDevice.get(device);
      return {
        device,
        count: row?.count ?? 0,
        percentage: row?.percentage ?? 0,
        color: DEVICE_COLOR[device],
      };
    });
  }, [data]);

  const hasData = rows.some((r) => r.count > 0);
  const visibleRows = rows.filter((r) => r.device !== 'other' || r.count > 0);

  return (
    <section
      data-testid="dashboard-device-breakdown"
      data-plan={plan}
      data-locked={locked || undefined}
      className="rounded-card border border-border bg-card px-5 pb-5 pt-[18px]"
    >
      <div className="mb-3.5 text-[12.5px] font-medium text-text-muted">
        {t('title')}
      </div>

      {isLoading ? (
        <div
          data-testid="device-loading"
          className="h-[144px] animate-pulse rounded-lg bg-border-soft/40"
          aria-hidden
        />
      ) : !hasData ? (
        <div
          data-testid="device-empty"
          className="flex h-[144px] items-center justify-center rounded-lg border border-dashed border-border-soft text-[12px] text-text-muted"
        >
          {t('empty')}
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <DonutChart
            data={visibleRows}
            centerLabel={t('centerLabel')}
            centerValue="100%"
          />
          <div className="flex flex-1 flex-col gap-2.5">
            {visibleRows.map((r) => (
              <div
                key={r.device}
                data-testid={`device-legend-${r.device}`}
                className="flex items-center gap-2 text-[12.5px] text-text-default"
              >
                <span
                  className="inline-block h-2 w-2 flex-shrink-0 rounded-[2px]"
                  style={{ background: r.color }}
                />
                <span className="flex-1">{t(`device.${r.device}`)}</span>
                <span className="font-medium tabular-nums">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && hasData && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-border-soft pt-3.5 text-[11.5px] text-text-muted">
          <Smartphone className="h-3 w-3" strokeWidth={1.5} />
          {t('footerHint', { pct: rows.find((r) => r.device === 'mobile')?.percentage ?? 0 })}
        </div>
      )}
    </section>
  );
}
