'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { enUS, ka, ru } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Infinity as InfinityIcon,
  Megaphone,
  Percent,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { getPromotionStatus, type PromotionStatus } from '@/lib/promotions/status';
import {
  DEFAULT_TZ,
  WEEKDAY_KEYS,
  dateOfDay,
  dayInZone,
  dayNumber,
  expandPromotionDays,
  mondayIndex,
  promotionDayBounds,
  restrictedWeekdays,
  toSegments,
} from '@/lib/promotions/calendar-days';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Promotion } from '@/types/menu';

// T22.25 / T2.8 — month calendar over the promotions list: which promotions
// run on which dates and where they overlap.
//
// The grid paints the real schedule (lib/promotions/calendar-days.ts):
// - Permanent promotions (no dates) run every day, so they are drawn in every
//   week — as thinner, lighter bars in their own lanes under the dated ones,
//   so a handful of always-on offers does not bury the dated bars.
// - Dated promotions cover their days inclusive, counted in the café timezone.
// - Weekday-restricted promotions (timeRestrictions enabled with days) are
//   painted only on those weekdays: Mon/Wed → one short segment per Monday
//   and Wednesday, never a continuous bar. This combines with both above.
// - Paused promotions are striped and muted, ended ones grey.
// - Each week row: day numbers, up to MAX_LANES lanes of dated bars, up to
//   MAX_PERMANENT_LANES thin permanent lanes, then a per-day "+N" chip for
//   whatever did not fit, opening that day's list.
// - Below md the grid becomes a weekly agenda: every promotion running in a
//   week is listed with the weekdays it runs that week.

export { dayInZone, dayNumber };

const MAX_LANES = 3;
const MAX_PERMANENT_LANES = 4;
// date-fns rather than Intl: browsers without Georgian ICU data fall back to English.
const DATE_LOCALES = { ka, en: enUS, ru } as const;

type PromotionKind = 'PERCENTAGE' | 'BANNER' | 'COMBO';

const KIND_STYLE: Record<
  PromotionKind,
  { Icon: LucideIcon; key: string; soft: string; edge: string; dot: string; icon: string }
> = {
  PERCENTAGE: {
    Icon: Percent,
    key: 'percentage',
    soft: 'bg-accent-soft',
    edge: 'border-l-accent',
    dot: 'bg-accent',
    icon: 'text-accent',
  },
  BANNER: {
    Icon: Megaphone,
    key: 'banner',
    soft: 'bg-warning-soft',
    edge: 'border-l-warning',
    dot: 'bg-warning',
    icon: 'text-warning',
  },
  COMBO: {
    Icon: Gift,
    key: 'combo',
    soft: 'bg-success-soft',
    edge: 'border-l-success',
    dot: 'bg-success',
    icon: 'text-success',
  },
};

// Diagonal stripes in two surface tokens: the "switched off" texture.
const PAUSED_STRIPES =
  'bg-[repeating-linear-gradient(-45deg,hsl(var(--chip))_0_4px,hsl(var(--card))_4px_8px)]';

/** Same inference the drawer uses for legacy rows without a `type`. */
function promotionKind(p: Pick<Promotion, 'type' | 'discountType'>): PromotionKind {
  if (p.type === 'PERCENTAGE' || p.type === 'BANNER' || p.type === 'COMBO') return p.type;
  if (p.discountType === 'FREE_ADDON') return 'COMBO';
  if (p.discountType === 'FIXED_AMOUNT') return 'BANNER';
  return 'PERCENTAGE';
}

/** The day as a local-midnight Date, for date-fns formatting. */
function localDateOfDay(n: number): Date {
  const d = dateOfDay(n);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// ── Layout ──────────────────────────────────────────────────────────────────

export interface CalendarEntry {
  id: string;
  /** First / last day covered; null = open-ended on that side. */
  from: number | null;
  to: number | null;
}

export interface CalendarBar {
  id: string;
  startCol: number; // 0-6
  endCol: number; // 0-6, inclusive
  lane: number;
  continuesLeft: boolean;
  continuesRight: boolean;
}

export interface CalendarWeek {
  days: number[];
  /** Bars in lanes 0…maxLanes-1. */
  bars: CalendarBar[];
  /** Per column: how many entries on that day did not get a visible lane. */
  hidden: number[];
  laneCount: number;
}

/** First and last day of the Monday-first grid that covers the month. */
export function monthGridRange(year: number, month: number): { start: number; end: number } {
  const first = dayNumber(year, month, 1);
  const last = dayNumber(year, month + 1, 1) - 1;
  const start = first - mondayIndex(first);
  const weekCount = Math.ceil((last - start + 1) / 7);
  return { start, end: start + weekCount * 7 - 1 };
}

/**
 * Month grid: the weeks (Monday-first) that contain any day of the month, and
 * per week the entries packed into lanes. Longer bars take the upper lanes so
 * a short promotion does not push a long one down mid-week. Several entries
 * may share an id (one promotion painted as separate weekday segments).
 */
export function layoutMonth(
  entries: CalendarEntry[],
  year: number,
  month: number,
  maxLanes: number = MAX_LANES,
): CalendarWeek[] {
  const { start: gridStart, end: gridEnd } = monthGridRange(year, month);
  const weekCount = (gridEnd - gridStart + 1) / 7;

  return Array.from({ length: weekCount }, (_, w) => {
    const ws = gridStart + w * 7;
    const we = ws + 6;
    const days = Array.from({ length: 7 }, (_, d) => ws + d);

    const segments = entries
      .filter((e) => (e.from === null || e.from <= we) && (e.to === null || e.to >= ws))
      .map((e, order) => {
        const startCol = e.from === null || e.from <= ws ? 0 : e.from - ws;
        const endCol = e.to === null || e.to >= we ? 6 : e.to - ws;
        return {
          id: e.id,
          startCol,
          endCol,
          order,
          continuesLeft: e.from === null || e.from < ws,
          continuesRight: e.to === null || e.to > we,
        };
      })
      .sort(
        (a, b) =>
          a.startCol - b.startCol || b.endCol - a.endCol || a.order - b.order,
      );

    const lanes: Array<Array<[number, number]>> = [];
    const bars: CalendarBar[] = [];
    const hidden = Array<number>(7).fill(0);

    for (const s of segments) {
      let lane = lanes.findIndex(
        (taken) => !taken.some(([a, b]) => s.startCol <= b && s.endCol >= a),
      );
      if (lane === -1) {
        lanes.push([]);
        lane = lanes.length - 1;
      }
      lanes[lane].push([s.startCol, s.endCol]);

      if (lane < maxLanes) {
        bars.push({
          id: s.id,
          startCol: s.startCol,
          endCol: s.endCol,
          lane,
          continuesLeft: s.continuesLeft,
          continuesRight: s.continuesRight,
        });
      } else {
        for (let c = s.startCol; c <= s.endCol; c++) hidden[c] += 1;
      }
    }

    return { days, bars, hidden, laneCount: Math.min(lanes.length, maxLanes) };
  });
}

/**
 * Monday-first weekday indexes → short label: all seven → `everyDay`,
 * otherwise contiguous runs joined ("Mon–Wed, Fri").
 */
export function weekdayRunsLabel(
  indexes: number[],
  name: (index: number) => string,
  everyDay: string,
): string {
  const sorted = Array.from(new Set(indexes)).sort((a, b) => a - b);
  if (sorted.length === 7) return everyDay;
  const runs: Array<[number, number]> = [];
  for (const i of sorted) {
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  }
  return runs
    .map(([a, b]) => (a === b ? name(a) : b === a + 1 ? `${name(a)}, ${name(b)}` : `${name(a)}–${name(b)}`))
    .join(', ');
}

// ── Component ───────────────────────────────────────────────────────────────

interface PromotionCalendarProps {
  promotions: Promotion[];
  locale?: 'ka' | 'en' | 'ru';
  /** The café's timezone (Menu.timezone); days are counted in it. */
  timeZone?: string;
  /** Opens the promotion's editor. */
  onSelect?: (promotion: Promotion) => void;
}

interface Item {
  promotion: Promotion;
  title: string;
  status: PromotionStatus;
  kind: PromotionKind;
  from: number | null;
  to: number | null;
  /** No date on either side: runs until switched off. */
  permanent: boolean;
  /** Monday-first weekday indexes it is limited to; null = every weekday. */
  weekdays: number[] | null;
  range: string;
  scope: string | null;
}

function localizedTitle(p: Promotion, locale: string): string {
  if (locale === 'en' && p.titleEn) return p.titleEn;
  if (locale === 'ru' && p.titleRu) return p.titleRu;
  return p.titleKa;
}

export function PromotionCalendar({
  promotions,
  locale = 'ka',
  timeZone = DEFAULT_TZ,
  onSelect,
}: PromotionCalendarProps) {
  const t = useTranslations('admin.editor.promotions');
  const tTypes = useTranslations('admin.promotions.drawer.fields.types');

  const today = useMemo(() => dayInZone(new Date(), timeZone)!, [timeZone]);
  const [anchor, setAnchor] = useState(() => {
    const d = dateOfDay(today);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  const dateLocale = DATE_LOCALES[locale] ?? enUS;
  const fmt = (n: number) => format(localDateOfDay(n), 'd MMM', { locale: dateLocale });
  const fmtLong = (n: number) => format(localDateOfDay(n), 'EEEE, d MMMM', { locale: dateLocale });
  const weekdayName = (index: number) => t(`calendar.weekdays.${WEEKDAY_KEYS[index]}`);
  const runsLabel = (indexes: number[]) =>
    weekdayRunsLabel(indexes, weekdayName, t('calendar.everyDay'));

  const items = useMemo<Item[]>(() => {
    const yearOf = (n: number) => dateOfDay(n).getUTCFullYear();
    return promotions.map((p) => {
      const { from, to } = promotionDayBounds(p, timeZone);
      let range: string;
      if (from === null && to === null) range = t('card.noDates');
      else if (to === null) range = t('card.fromDate', { date: fmt(from!) });
      else if (from === null) range = t('card.untilDate', { date: fmt(to) });
      else {
        const withYear = (n: number) => `${fmt(n)} ${yearOf(n)}`;
        range =
          yearOf(from) === yearOf(to)
            ? `${fmt(from)} – ${withYear(to)}`
            : `${withYear(from)} – ${withYear(to)}`;
      }

      let scope: string | null = null;
      if (p.applyTo === 'CATEGORY' && p.category) {
        const c = p.category;
        const name = (locale === 'en' && c.nameEn) || (locale === 'ru' && c.nameRu) || c.nameKa;
        scope = t('card.appliedToCategory', { name });
      } else if (p.applyTo === 'ENTIRE_MENU') {
        scope = t('card.appliedToWholeMenu');
      }

      const restricted = restrictedWeekdays(p.timeRestrictions);
      return {
        promotion: p,
        title: localizedTitle(p, locale),
        status: getPromotionStatus(p),
        kind: promotionKind(p),
        from,
        to,
        permanent: from === null && to === null,
        weekdays: restricted ? Array.from(restricted).sort((a, b) => a - b) : null,
        range,
        scope,
      };
    });
    // fmt depends only on dateLocale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotions, timeZone, locale, dateLocale, t]);

  const byId = useMemo(() => new Map(items.map((i) => [i.promotion.id, i])), [items]);

  // Which days of this month's grid each promotion runs on. The window is one
  // day wider on each side so a bar reaching past the grid edge still gets
  // its continuation chevron.
  const { runDays, datedWeeks, permanentWeeks } = useMemo(() => {
    const grid = monthGridRange(anchor.year, anchor.month);
    const window = { fromDay: grid.start - 1, toDay: grid.end + 1, timeZone };
    const runDays = new Map<string, Set<number>>();
    const dated: CalendarEntry[] = [];
    const permanent: CalendarEntry[] = [];
    for (const i of items) {
      const days = expandPromotionDays(i.promotion, window);
      runDays.set(i.promotion.id, new Set(days));
      const target = i.permanent ? permanent : dated;
      for (const s of toSegments(days)) target.push({ id: i.promotion.id, from: s.from, to: s.to });
    }
    return {
      runDays,
      datedWeeks: layoutMonth(dated, anchor.year, anchor.month, MAX_LANES),
      permanentWeeks: layoutMonth(permanent, anchor.year, anchor.month, MAX_PERMANENT_LANES),
    };
  }, [items, anchor, timeZone]);

  const runsOn = (i: Item, day: number) => runDays.get(i.promotion.id)?.has(day) ?? false;

  const monthLabel = format(new Date(anchor.year, anchor.month, 1), 'LLLL yyyy', {
    locale: dateLocale,
  });

  const shiftMonth = (delta: number) =>
    setAnchor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  const goToday = () => {
    const d = dateOfDay(today);
    setAnchor({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
  };

  const statusLabel = (s: PromotionStatus) => t(`status.${s}`);
  const describe = (i: Item) =>
    [i.title, i.range, i.weekdays ? runsLabel(i.weekdays) : null, statusLabel(i.status)]
      .filter(Boolean)
      .join(' · ');

  const details = (i: Item) => (
    <div className="flex max-w-[260px] flex-col gap-0.5 py-0.5 text-left">
      <span className="text-[12px] font-semibold text-text-default">{i.title}</span>
      <span className="tabular-nums text-text-muted">{i.range}</span>
      {i.weekdays ? (
        <span className="text-text-muted" data-testid="promotion-calendar-weekdays">
          {t('calendar.onlyOn', { days: runsLabel(i.weekdays) })}
        </span>
      ) : null}
      <span className="text-text-muted">
        {tTypes(`${KIND_STYLE[i.kind].key}.title`)}
        {i.scope ? ` · ${i.scope}` : ''}
      </span>
      <span
        className={cn(
          'mt-0.5 inline-flex items-center gap-1.5 font-medium',
          i.status === 'active' && 'text-success',
          i.status === 'scheduled' && 'text-accent',
          (i.status === 'paused' || i.status === 'ended') && 'text-text-muted',
        )}
      >
        <span
          className={cn(
            'size-1.5 rounded-pill',
            i.status === 'active' && 'bg-success',
            i.status === 'scheduled' && 'bg-accent',
            (i.status === 'paused' || i.status === 'ended') && 'bg-text-subtle',
          )}
        />
        {statusLabel(i.status)}
      </span>
    </div>
  );

  const withTooltip = (i: Item, key: string, trigger: React.ReactElement) => (
    <Tooltip key={key}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent tone="light" side="top">
        {details(i)}
      </TooltipContent>
    </Tooltip>
  );

  /** Surface + text classes shared by bars, agenda rows and list rows. */
  const surface = (i: Item) => {
    const k = KIND_STYLE[i.kind];
    if (i.status === 'paused') return cn(PAUSED_STRIPES, 'border-l-text-subtle text-text-muted');
    if (i.status === 'ended') return 'bg-chip border-l-text-subtle text-text-muted';
    return cn(k.soft, k.edge, 'text-text-default');
  };
  const iconTone = (i: Item) =>
    i.status === 'paused' || i.status === 'ended' ? 'text-text-subtle' : KIND_STYLE[i.kind].icon;

  /** One promotion as a full-width row (agenda and "+N" popover). */
  const row = (i: Item, testId: string, when?: string) => {
    const { Icon } = KIND_STYLE[i.kind];
    return (
      <button
        key={testId}
        type="button"
        data-testid={testId}
        data-status={i.status}
        data-permanent={i.permanent ? 'true' : undefined}
        onClick={() => onSelect?.(i.promotion)}
        className={cn(
          'flex w-full min-w-0 items-center gap-2.5 rounded-md border-l-[3px] px-2.5 py-2 text-left',
          'transition-shadow hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          surface(i),
        )}
      >
        <Icon className={cn('size-3.5 shrink-0', iconTone(i))} strokeWidth={1.5} aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[12.5px] font-medium">{i.title}</span>
          <span className="truncate text-[11.5px] tabular-nums text-text-muted">
            {when ? (
              <span className="font-medium text-text-default" data-testid={`${testId}-days`}>
                {when}
              </span>
            ) : null}
            {when ? ' · ' : ''}
            {i.permanent && when ? '' : `${i.range} · `}
            {statusLabel(i.status)}
          </span>
        </span>
        {i.permanent ? (
          <InfinityIcon className="size-3.5 shrink-0 text-text-subtle" strokeWidth={1.5} aria-hidden />
        ) : null}
      </button>
    );
  };

  /** One bar in the grid; `thin` for permanent promotions. */
  const bar = (b: CalendarBar, rowIndex: number, thin: boolean) => {
    const i = byId.get(b.id)!;
    const Icon = thin ? InfinityIcon : KIND_STYLE[i.kind].Icon;
    const key = `${b.id}:${b.startCol}`;
    return (
      <div
        key={key}
        className="flex min-w-0"
        style={{
          gridColumn: `${b.startCol + 1} / ${b.endCol + 2}`,
          gridRow: rowIndex,
        }}
      >
        {withTooltip(
          i,
          key,
          <button
            type="button"
            data-testid={`promotion-calendar-bar-${b.id}`}
            data-status={i.status}
            data-permanent={thin ? 'true' : undefined}
            data-start-col={b.startCol}
            data-end-col={b.endCol}
            aria-label={describe(i)}
            onClick={() => onSelect?.(i.promotion)}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-1 text-left leading-none',
              thin ? 'h-3.5 text-[10.5px] font-medium' : 'h-5 text-[11px] font-medium',
              'transition-shadow hover:shadow-xs focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              surface(i),
              thin && i.status !== 'paused' && i.status !== 'ended' && 'text-text-muted',
              b.continuesLeft
                ? 'rounded-l-none border-l-0 pl-1'
                : cn('ml-1 rounded-l-xs pl-1.5', thin ? 'border-l-2' : 'border-l-[3px]'),
              b.continuesRight ? 'rounded-r-none pr-1' : 'mr-1 rounded-r-xs pr-1.5',
            )}
          >
            {b.continuesLeft ? (
              <ChevronLeft className="size-3 shrink-0 text-text-subtle" strokeWidth={1.5} aria-hidden />
            ) : null}
            <Icon
              className={cn('shrink-0', thin ? 'size-2.5' : 'size-3', thin ? 'text-text-subtle' : iconTone(i))}
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{i.title}</span>
            {b.continuesRight ? (
              <ChevronRight className="size-3 shrink-0 text-text-subtle" strokeWidth={1.5} aria-hidden />
            ) : null}
          </button>,
        )}
      </div>
    );
  };

  // Agenda: per week, every promotion with a run day in it, with those days.
  const agenda = datedWeeks
    .map((week) => {
      const ws = week.days[0];
      const we = week.days[6];
      const inWeek = items
        .map((i) => {
          const indexes = week.days.filter((d) => runsOn(i, d)).map(mondayIndex);
          return { item: i, indexes };
        })
        .filter((e) => e.indexes.length > 0);
      return { ws, we, inWeek };
    })
    .filter((w) => w.inWeek.length > 0);

  return (
    <TooltipProvider delayDuration={150}>
      <section
        className="mb-5 rounded-card border border-border bg-card"
        data-testid="promotion-calendar"
        data-timezone={timeZone}
        aria-label={t('calendar.ariaLabel')}
      >
        {/* Header: month + navigation */}
        <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
          <h3
            className="text-[14px] font-semibold capitalize tracking-[-0.1px] text-text-default"
            data-testid="promotion-calendar-month"
          >
            {monthLabel}
          </h3>
          <div className="flex items-center rounded-md border border-border">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label={t('calendar.prev')}
              data-testid="promotion-calendar-prev"
              className="flex size-7 items-center justify-center rounded-l-md text-text-muted hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeft className="size-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={goToday}
              data-testid="promotion-calendar-today"
              className="h-7 border-x border-border px-2.5 text-[12px] font-medium text-text-default hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t('calendar.today')}
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={t('calendar.next')}
              data-testid="promotion-calendar-next"
              className="flex size-7 items-center justify-center rounded-r-md text-text-muted hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronRight className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Month grid (md and up) */}
        <div className="hidden md:block" data-testid="promotion-calendar-grid">
          <div className="grid grid-cols-7 border-t border-border-soft">
            {WEEKDAY_KEYS.map((key) => (
              <div
                key={key}
                className="px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.6px] text-text-subtle"
              >
                {t(`calendar.weekdays.${key}`)}
              </div>
            ))}
          </div>

          {datedWeeks.map((week, wi) => {
            const perm = permanentWeeks[wi];
            const hidden = week.hidden.map((n, di) => n + perm.hidden[di]);
            const hasOverflow = hidden.some((n) => n > 0);
            const permanentRow0 = week.laneCount + 2;
            const overflowRow = permanentRow0 + perm.laneCount;
            const rows = [
              '28px',
              ...Array<string>(week.laneCount).fill('20px'),
              ...Array<string>(perm.laneCount).fill('14px'),
              ...(hasOverflow ? ['20px'] : []),
            ];
            return (
              <div
                key={week.days[0]}
                className={cn('relative border-t border-border-soft', wi === datedWeeks.length - 1 && 'rounded-b-card')}
                data-testid="promotion-calendar-week"
              >
                {/* Day cell backgrounds */}
                <div className="absolute inset-0 grid grid-cols-7" aria-hidden>
                  {week.days.map((day, di) => {
                    const inMonth = dateOfDay(day).getUTCMonth() === anchor.month;
                    return (
                      <div
                        key={day}
                        className={cn(
                          di > 0 && 'border-l border-border-soft',
                          !inMonth && 'bg-bg',
                          wi === datedWeeks.length - 1 && di === 0 && 'rounded-bl-card',
                          wi === datedWeeks.length - 1 && di === 6 && 'rounded-br-card',
                        )}
                      />
                    );
                  })}
                </div>

                <div
                  className="relative grid min-h-[88px] grid-cols-7 content-start gap-y-0.5 pb-2"
                  style={{ gridTemplateRows: rows.join(' ') }}
                >
                  {week.days.map((day, di) => {
                    const inMonth = dateOfDay(day).getUTCMonth() === anchor.month;
                    const isToday = day === today;
                    return (
                      <div
                        key={day}
                        className="flex items-start px-1.5 pt-1.5"
                        style={{ gridColumn: di + 1, gridRow: 1 }}
                      >
                        <span
                          data-testid={isToday ? 'promotion-calendar-today-cell' : undefined}
                          aria-current={isToday ? 'date' : undefined}
                          className={cn(
                            'inline-flex size-[22px] items-center justify-center rounded-pill text-[12px] tabular-nums',
                            isToday && 'bg-accent font-semibold text-white',
                            !isToday && inMonth && 'font-medium text-text-default',
                            !isToday && !inMonth && 'text-text-subtle',
                          )}
                        >
                          {dateOfDay(day).getUTCDate()}
                        </span>
                      </div>
                    );
                  })}

                  {week.bars.map((b) => bar(b, b.lane + 2, false))}
                  {perm.bars.map((b) => bar(b, permanentRow0 + b.lane, true))}

                  {hidden.map((count, di) => {
                    if (count === 0) return null;
                    const day = week.days[di];
                    const onDay = items.filter((i) => runsOn(i, day));
                    return (
                      <div
                        key={`more-${day}`}
                        className="flex min-w-0 px-1"
                        style={{ gridColumn: di + 1, gridRow: overflowRow }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              data-testid={`promotion-calendar-more-${day}`}
                              className="h-5 rounded-xs px-1.5 text-[11px] font-semibold tabular-nums text-text-muted hover:bg-chip hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              {t('calendar.more', { count })}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            size="sm"
                            className="w-[260px]"
                            data-testid="promotion-calendar-day-list"
                          >
                            <p className="mb-2 text-[12px] font-semibold capitalize text-text-default">
                              {fmtLong(day)}
                            </p>
                            <div className="flex flex-col gap-1">
                              {onDay.map((i) =>
                                row(i, `promotion-calendar-day-item-${i.promotion.id}`),
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Agenda (below md): per week, every promotion running in it with the
            weekdays it runs that week */}
        <div
          className="space-y-3 border-t border-border-soft px-4 py-3 md:hidden"
          data-testid="promotion-calendar-agenda"
        >
          {agenda.length === 0 ? (
            <p className="py-2 text-center text-[12.5px] text-text-muted">
              {t('calendar.emptyMonth')}
            </p>
          ) : (
            agenda.map(({ ws, we, inWeek }) => {
              return (
                <section key={ws} data-testid="promotion-calendar-agenda-week">
                  <h4 className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.6px] text-text-subtle tabular-nums">
                    {fmt(ws)} – {fmt(we)}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {inWeek.map(({ item, indexes }) =>
                      row(item, `promotion-calendar-agenda-item-${item.promotion.id}`, runsLabel(indexes)),
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>

        {/* Legend */}
        <footer
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border-soft px-4 py-2.5 text-[11.5px] text-text-muted"
          data-testid="promotion-calendar-legend"
        >
          {(Object.keys(KIND_STYLE) as PromotionKind[]).map((kind) => {
            const k = KIND_STYLE[kind];
            return (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className={cn('size-2 rounded-pill', k.dot)} aria-hidden />
                {tTypes(`${k.key}.title`)}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5">
            <InfinityIcon className="size-3.5 text-text-subtle" strokeWidth={1.5} aria-hidden />
            {t('calendar.alwaysOn')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn('h-2.5 w-4 rounded-xs border border-border', PAUSED_STRIPES)}
              aria-hidden
            />
            {statusLabel('paused')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-chip" aria-hidden />
            {statusLabel('ended')}
          </span>
        </footer>
      </section>
    </TooltipProvider>
  );
}
