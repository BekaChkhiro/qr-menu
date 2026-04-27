'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  isAfter,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
} from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Segmented, SegmentedItem } from '@/components/ui/segmented';
import { cn } from '@/lib/utils';

import { useAnalyticsRange } from './analytics-range-context';

const ISO = (d: Date): string => format(d, 'yyyy-MM-dd');

type PresetKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'lastQuarter'
  | 'yearToDate';

interface PresetRange {
  key: PresetKey;
  start: Date;
  end: Date;
}

function buildPresets(now: Date): PresetRange[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = subDays(today, 1);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  return [
    { key: 'today', start: today, end: today },
    { key: 'yesterday', start: yesterday, end: yesterday },
    { key: 'last7', start: subDays(today, 6), end: today },
    { key: 'last30', start: subDays(today, 29), end: today },
    { key: 'thisMonth', start: startOfMonth(today), end: today },
    { key: 'lastMonth', start: lastMonthStart, end: endOfMonth(lastMonthStart) },
    {
      key: 'lastQuarter',
      start: startOfQuarter(subQuarters(today, 1)),
      end: subDays(startOfQuarter(today), 1),
    },
    { key: 'yearToDate', start: startOfYear(today), end: today },
  ];
}

export function DateRangePicker() {
  const t = useTranslations('admin.editor.analytics.range');
  const locale = useLocale();
  const { filters, setPreset, setCustom } = useAnalyticsRange();

  const [open, setOpen] = useState(false);

  // Active period for the segmented control.
  const activeMode =
    filters.period === '7d' || filters.period === '30d' || filters.period === '90d'
      ? filters.period
      : 'custom';

  const customLabel = useMemo(() => {
    if (filters.period !== 'custom' || !filters.startDate || !filters.endDate) {
      return t('customDefault');
    }
    return formatRangeLabel(filters.startDate, filters.endDate, locale);
  }, [filters, locale, t]);

  const handleSegmentChange = (next: string) => {
    if (next === '7d' || next === '30d' || next === '90d') {
      setPreset(next);
      setOpen(false);
      return;
    }
    if (next === 'custom') {
      setOpen(true);
    }
  };

  return (
    <div
      data-testid="editor-analytics-range"
      data-active-period={filters.period}
      className="flex items-center justify-end"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor>
          <Segmented
            value={activeMode}
            onValueChange={handleSegmentChange}
            ariaLabel={t('segmentAriaLabel')}
            data-testid="editor-analytics-range-segment"
          >
            <SegmentedItem
              value="7d"
              data-testid="editor-analytics-range-7d"
            >
              {t('seg.7d')}
            </SegmentedItem>
            <SegmentedItem
              value="30d"
              data-testid="editor-analytics-range-30d"
            >
              {t('seg.30d')}
            </SegmentedItem>
            <SegmentedItem
              value="90d"
              data-testid="editor-analytics-range-90d"
            >
              {t('seg.90d')}
            </SegmentedItem>
            <PopoverTrigger asChild>
              <SegmentedItem
                value="custom"
                data-testid="editor-analytics-range-custom"
                className="gap-1.5 px-[10px]"
              >
                <Calendar size={12} strokeWidth={1.8} aria-hidden="true" />
                <span>{customLabel}</span>
              </SegmentedItem>
            </PopoverTrigger>
          </Segmented>
        </PopoverAnchor>
        <PopoverContent
          align="end"
          sideOffset={8}
          withArrow={false}
          size="md"
          className="w-[620px] !p-[18px]"
          data-testid="editor-analytics-range-popover"
        >
          <DateRangeBody
            initialStart={filters.startDate ?? ISO(subDays(new Date(), 29))}
            initialEnd={filters.endDate ?? ISO(new Date())}
            onCancel={() => setOpen(false)}
            onApply={(start, end) => {
              setCustom(start, end);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Body — preset rail + two-month grid + footer
// ─────────────────────────────────────────────────────────────────────────────

interface DateRangeBodyProps {
  initialStart: string;
  initialEnd: string;
  onCancel: () => void;
  onApply: (startISO: string, endISO: string) => void;
}

function DateRangeBody({
  initialStart,
  initialEnd,
  onCancel,
  onApply,
}: DateRangeBodyProps) {
  const t = useTranslations('admin.editor.analytics.range');
  const locale = useLocale();

  const [start, setStart] = useState<Date>(parseISO(initialStart));
  const [end, setEnd] = useState<Date>(parseISO(initialEnd));
  // The "anchor" tracks click sequencing — first click sets start (clears end),
  // second click sets end and clamps order.
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(parseISO(initialEnd)));

  const presets = useMemo(() => buildPresets(new Date()), []);

  const dayCount = differenceInCalendarDays(end, start) + 1;

  const handleDayPick = (day: Date) => {
    if (!pendingStart) {
      // First click: lock new start, clear end visually.
      setPendingStart(day);
      setStart(day);
      setEnd(day);
      return;
    }
    // Second click: order start/end then commit pending.
    if (isAfter(pendingStart, day)) {
      setStart(day);
      setEnd(pendingStart);
    } else {
      setStart(pendingStart);
      setEnd(day);
    }
    setPendingStart(null);
  };

  const handlePreset = (key: PresetKey) => {
    const preset = presets.find((p) => p.key === key);
    if (!preset) return;
    setStart(preset.start);
    setEnd(preset.end);
    setPendingStart(null);
    setViewMonth(startOfMonth(preset.end));
  };

  const handleApply = () => {
    onApply(ISO(start), ISO(end));
  };

  // Identify which preset (if any) currently matches the picked range.
  const activePresetKey = useMemo<PresetKey | null>(() => {
    for (const p of presets) {
      if (isSameDay(p.start, start) && isSameDay(p.end, end)) return p.key;
    }
    return null;
  }, [presets, start, end]);

  const previousMonth = subMonths(viewMonth, 1);

  return (
    <div className="flex gap-[18px]">
      {/* Preset rail */}
      <ul
        data-testid="editor-analytics-range-presets"
        className="flex w-[140px] shrink-0 flex-col gap-[2px] border-r border-border-soft pr-[14px]"
        role="listbox"
        aria-label={t('presetsAriaLabel')}
      >
        {presets.map((p) => {
          const active = activePresetKey === p.key;
          return (
            <li key={p.key}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                data-testid={`editor-analytics-range-preset-${p.key}`}
                data-active={active}
                onClick={() => handlePreset(p.key)}
                className={cn(
                  'w-full rounded-[6px] px-[10px] py-[6px] text-left text-[12.5px] transition-colors',
                  active
                    ? 'bg-chip font-semibold text-text-default'
                    : 'font-medium text-text-muted hover:text-text-default',
                )}
              >
                {t(`presets.${p.key}`)}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Calendars + footer */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-[18px]">
          <CalendarMonth
            month={previousMonth}
            rangeStart={start}
            rangeEnd={end}
            onPick={handleDayPick}
            locale={locale}
            t={t}
            navLeft={
              <button
                type="button"
                data-testid="editor-analytics-range-prev-month"
                aria-label={t('prevMonth')}
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                className="rounded-full p-1 text-text-muted hover:text-text-default"
              >
                <ChevronLeft size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            }
          />
          <CalendarMonth
            month={viewMonth}
            rangeStart={start}
            rangeEnd={end}
            onPick={handleDayPick}
            locale={locale}
            t={t}
            navRight={
              <button
                type="button"
                data-testid="editor-analytics-range-next-month"
                aria-label={t('nextMonth')}
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="rounded-full p-1 text-text-muted hover:text-text-default"
              >
                <ChevronRight size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            }
          />
        </div>

        <div className="mt-[14px] flex items-center justify-between gap-3 border-t border-border-soft pt-[14px]">
          <div
            data-testid="editor-analytics-range-summary"
            className="text-[12px] text-text-muted"
          >
            <span className="font-semibold text-text-default">
              {format(start, 'MMM d')}
            </span>{' '}
            —{' '}
            <span className="font-semibold text-text-default">
              {format(end, 'MMM d, yyyy')}
            </span>
            <span className="ml-[10px] text-text-subtle">
              {t('summaryDays', { count: dayCount })}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              data-testid="editor-analytics-range-cancel"
              onClick={onCancel}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="editor-analytics-range-apply"
              onClick={handleApply}
            >
              {t('apply')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarMonth — single month grid, Mon-first, range highlight
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarMonthProps {
  month: Date;
  rangeStart: Date;
  rangeEnd: Date;
  onPick: (day: Date) => void;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  navLeft?: React.ReactNode;
  navRight?: React.ReactNode;
}

function CalendarMonth({
  month,
  rangeStart,
  rangeEnd,
  onPick,
  locale,
  t,
  navLeft,
  navRight,
}: CalendarMonthProps) {
  const monthStart = startOfMonth(month);
  // Mon=0..Sun=6 (date-fns getDay returns Sun=0..Sat=6 — shift it).
  const firstWeekday = (getDay(monthStart) + 6) % 7;
  const daysInMonth = getDaysInMonth(month);
  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
    cells.push(day);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const dayKeys: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> =
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const monthLabel = formatMonthLabel(month, locale);

  return (
    <div className="w-[220px]" data-testid="editor-analytics-range-month">
      <div className="relative mb-[10px] flex items-center justify-center text-[12.5px] font-semibold text-text-default">
        {navLeft && <span className="absolute left-0">{navLeft}</span>}
        <span data-testid="editor-analytics-range-month-label">{monthLabel}</span>
        {navRight && <span className="absolute right-0">{navRight}</span>}
      </div>
      <div className="mb-1 grid grid-cols-7 gap-[2px]">
        {dayKeys.map((k) => (
          <span
            key={k}
            className="text-center text-[9.5px] font-semibold uppercase text-text-subtle"
          >
            {t(`weekdays.${k}`)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const isStart = isSameDay(day, rangeStart);
          const isEnd = isSameDay(day, rangeEnd);
          const inRange =
            !isStart && !isEnd
              ? isWithinInterval(day, { start: rangeStart, end: rangeEnd })
              : false;
          const isEdge = isStart || isEnd;
          const dayLabel = format(day, 'EEE, MMM d, yyyy');
          return (
            <button
              key={i}
              type="button"
              data-testid={`editor-analytics-range-day-${ISO(day)}`}
              data-day={ISO(day)}
              data-edge={isEdge ? 'true' : 'false'}
              data-in-range={inRange ? 'true' : 'false'}
              aria-label={dayLabel}
              onClick={() => onPick(day)}
              className={cn(
                'flex h-[26px] items-center justify-center rounded-[6px] text-[11.5px] font-medium tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isEdge
                  ? 'bg-text-default text-white'
                  : inRange
                    ? 'rounded-none bg-accent-soft text-accent'
                    : 'text-text-default hover:bg-chip',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseISO(s: string): Date {
  // Treat the ISO yyyy-MM-dd as a local date (avoid TZ shifts in the picker).
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatRangeLabel(
  startISO: string,
  endISO: string,
  locale: string,
): string {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (locale === 'ka' || locale === 'ru') {
    return `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
}

function formatMonthLabel(month: Date, locale: string): string {
  if (locale === 'ka' || locale === 'ru') {
    return format(month, 'LLLL yyyy');
  }
  return format(month, 'MMMM yyyy');
}
