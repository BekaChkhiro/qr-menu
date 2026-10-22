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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Promotion } from '@/types/menu';

// T22.25 — month calendar over the promotions list: which promotions run on
// which dates and where they overlap.
//
// Redesign:
// - Permanent promotions (no dates at all) are not painted across every week;
//   they sit in a compact "always on" strip above the grid. Only promotions
//   with at least one date boundary go into the grid.
// - Each week row is a header line with the day numbers, then up to
//   MAX_LANES lanes of bars below it. Overlaps beyond that collapse into a
//   per-day "+N" chip that opens that day's list.
// - Bars are tinted by promotion type (token *-soft background, solid 3px
//   accent at the real start). Paused promotions are striped and muted,
//   ended ones grey, so neither reads as running.
// - Below md the grid becomes an agenda grouped by week.
// - Days are counted in the café's timezone, weeks start on Monday.

const DEFAULT_TZ = 'Asia/Tbilisi';
const MAX_LANES = 3;
const DAY_MS = 86_400_000;
// date-fns rather than Intl: browsers without Georgian ICU data fall back to English.
const DATE_LOCALES = { ka, en: enUS, ru } as const;
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

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

// ── Day arithmetic ──────────────────────────────────────────────────────────
//
// A "day number" is the count of days since 1970-01-01 for a calendar date.
// Working in whole days keeps the grid independent of the browser's timezone.

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = zoneFormatters.get(timeZone);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      f = zoneFormatter(DEFAULT_TZ);
    }
    zoneFormatters.set(timeZone, f);
  }
  return f;
}

export function dayNumber(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day) / DAY_MS;
}

/** The café-local calendar day an instant falls on. */
export function dayInZone(value: Date | string, timeZone: string = DEFAULT_TZ): number | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const parts = zoneFormatter(timeZone).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return dayNumber(get('year'), get('month') - 1, get('day'));
}

function dateOfDay(n: number): Date {
  return new Date(n * DAY_MS);
}

/** The day as a local-midnight Date, for date-fns formatting. */
function localDateOfDay(n: number): Date {
  const d = dateOfDay(n);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function mondayIndex(n: number): number {
  return (dateOfDay(n).getUTCDay() + 6) % 7;
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
  /** Bars in lanes 0…MAX_LANES-1. */
  bars: CalendarBar[];
  /** Per column: how many promotions on that day did not get a visible lane. */
  hidden: number[];
  laneCount: number;
}

function covers(e: Pick<CalendarEntry, 'from' | 'to'>, day: number): boolean {
  return (e.from === null || e.from <= day) && (e.to === null || e.to >= day);
}

/**
 * Month grid: the weeks (Monday-first) that contain any day of the month, and
 * per week the entries packed into lanes. Longer bars take the upper lanes so
 * a short promotion does not push a long one down mid-week.
 */
export function layoutMonth(
  entries: CalendarEntry[],
  year: number,
  month: number,
  maxLanes: number = MAX_LANES,
): CalendarWeek[] {
  const first = dayNumber(year, month, 1);
  const last = dayNumber(year, month + 1, 1) - 1;
  const gridStart = first - mondayIndex(first);
  const weekCount = Math.ceil((last - gridStart + 1) / 7);

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

  const items = useMemo<Item[]>(() => {
    const yearOf = (n: number) => dateOfDay(n).getUTCFullYear();
    return promotions.map((p) => {
      const from = p.startDate ? dayInZone(p.startDate, timeZone) : null;
      const to = p.endDate ? dayInZone(p.endDate, timeZone) : null;
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

      return {
        promotion: p,
        title: localizedTitle(p, locale),
        status: getPromotionStatus(p),
        kind: promotionKind(p),
        from,
        to,
        range,
        scope,
      };
    });
    // fmt depends only on dateLocale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotions, timeZone, locale, dateLocale, t]);

  const permanent = items.filter((i) => i.from === null && i.to === null);
  const dated = items.filter(
    (i) => (i.from !== null || i.to !== null) && (i.from === null || i.to === null || i.to >= i.from),
  );
  const byId = useMemo(() => new Map(items.map((i) => [i.promotion.id, i])), [items]);

  const weeks = useMemo(
    () =>
      layoutMonth(
        dated.map((i) => ({ id: i.promotion.id, from: i.from, to: i.to })),
        anchor.year,
        anchor.month,
      ),
    // `dated` is derived from `items`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, anchor],
  );

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
  const describe = (i: Item) => [i.title, i.range, statusLabel(i.status)].join(' · ');

  const details = (i: Item) => (
    <div className="flex max-w-[260px] flex-col gap-0.5 py-0.5 text-left">
      <span className="text-[12px] font-semibold text-text-default">{i.title}</span>
      <span className="tabular-nums text-text-muted">{i.range}</span>
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

  const withTooltip = (i: Item, trigger: React.ReactElement) => (
    <Tooltip key={i.promotion.id}>
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
  const row = (i: Item, testId: string) => {
    const { Icon } = KIND_STYLE[i.kind];
    return (
      <button
        key={i.promotion.id}
        type="button"
        data-testid={testId}
        data-status={i.status}
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
            {i.range} · {statusLabel(i.status)}
          </span>
        </span>
      </button>
    );
  };

  const agenda = (() => {
    const placed = new Set<string>();
    return weeks
      .map((week) => {
        const ws = week.days[0];
        const we = week.days[6];
        const inWeek = dated.filter(
          (i) =>
            !placed.has(i.promotion.id) &&
            (i.from === null || i.from <= we) &&
            (i.to === null || i.to >= ws),
        );
        inWeek.forEach((i) => placed.add(i.promotion.id));
        return { ws, we, inWeek };
      })
      .filter((w) => w.inWeek.length > 0);
  })();

  return (
    <TooltipProvider delayDuration={150}>
      <section
        className="mb-5 rounded-card border border-border bg-card"
        data-testid="promotion-calendar"
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

        {/* Always-on strip: promotions without dates */}
        {permanent.length > 0 ? (
          <div
            data-testid="promotion-calendar-permanent"
            className="flex flex-wrap items-center gap-1.5 border-t border-border-soft px-4 py-2.5"
          >
            <span className="mr-1 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.6px] text-text-subtle">
              <InfinityIcon className="size-3.5" strokeWidth={1.5} aria-hidden />
              {t('calendar.alwaysOn')}
            </span>
            {permanent.map((i) =>
              withTooltip(
                i,
                <button
                  key={i.promotion.id}
                  type="button"
                  data-testid={`promotion-calendar-permanent-${i.promotion.id}`}
                  data-status={i.status}
                  aria-label={describe(i)}
                  onClick={() => onSelect?.(i.promotion)}
                  className={cn(
                    'inline-flex h-7 max-w-[240px] items-center gap-1.5 rounded-pill border border-border px-2.5 text-[12px] font-medium',
                    'transition-shadow hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    i.status === 'paused'
                      ? cn(PAUSED_STRIPES, 'border-dashed text-text-muted')
                      : 'bg-card text-text-default',
                  )}
                >
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-pill',
                      i.status === 'paused' || i.status === 'ended'
                        ? 'bg-text-subtle'
                        : KIND_STYLE[i.kind].dot,
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{i.title}</span>
                  {i.status === 'paused' ? (
                    <span className="shrink-0 text-[11px] font-normal text-text-subtle">
                      · {statusLabel(i.status)}
                    </span>
                  ) : null}
                </button>,
              ),
            )}
          </div>
        ) : null}

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

          {weeks.map((week, wi) => {
            const hasOverflow = week.hidden.some((n) => n > 0);
            const rows = [
              '28px',
              ...Array<string>(week.laneCount).fill('20px'),
              ...(hasOverflow ? ['20px'] : []),
            ];
            return (
              <div
                key={week.days[0]}
                className={cn('relative border-t border-border-soft', wi === weeks.length - 1 && 'rounded-b-card')}
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
                          wi === weeks.length - 1 && di === 0 && 'rounded-bl-card',
                          wi === weeks.length - 1 && di === 6 && 'rounded-br-card',
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

                  {week.bars.map((bar) => {
                    const i = byId.get(bar.id)!;
                    const { Icon } = KIND_STYLE[i.kind];
                    return (
                      <div
                        key={bar.id}
                        className="flex min-w-0"
                        style={{
                          gridColumn: `${bar.startCol + 1} / ${bar.endCol + 2}`,
                          gridRow: bar.lane + 2,
                        }}
                      >
                        {withTooltip(
                          i,
                          <button
                            type="button"
                            data-testid={`promotion-calendar-bar-${bar.id}`}
                            data-status={i.status}
                            aria-label={describe(i)}
                            onClick={() => onSelect?.(i.promotion)}
                            className={cn(
                              'flex h-5 min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-medium leading-none',
                              'transition-shadow hover:shadow-xs focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                              surface(i),
                              bar.continuesLeft
                                ? 'rounded-l-none border-l-0 pl-1'
                                : 'ml-1 rounded-l-xs border-l-[3px] pl-1.5',
                              bar.continuesRight ? 'rounded-r-none pr-1' : 'mr-1 rounded-r-xs pr-1.5',
                            )}
                          >
                            {bar.continuesLeft ? (
                              <ChevronLeft
                                className="size-3 shrink-0 text-text-subtle"
                                strokeWidth={1.5}
                                aria-hidden
                              />
                            ) : null}
                            <Icon
                              className={cn('size-3 shrink-0', iconTone(i))}
                              strokeWidth={1.5}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate">{i.title}</span>
                            {bar.continuesRight ? (
                              <ChevronRight
                                className="size-3 shrink-0 text-text-subtle"
                                strokeWidth={1.5}
                                aria-hidden
                              />
                            ) : null}
                          </button>,
                        )}
                      </div>
                    );
                  })}

                  {week.hidden.map((count, di) => {
                    if (count === 0) return null;
                    const day = week.days[di];
                    const onDay = dated.filter((i) => covers(i, day));
                    return (
                      <div
                        key={`more-${day}`}
                        className="flex min-w-0 px-1"
                        style={{ gridColumn: di + 1, gridRow: week.laneCount + 2 }}
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

        {/* Agenda (below md): each dated promotion once, under the first week of
            the month it touches, so a long promotion does not repeat down the list */}
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
                    {inWeek.map((i) => row(i, `promotion-calendar-agenda-item-${i.promotion.id}`))}
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
