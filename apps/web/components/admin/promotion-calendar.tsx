'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Promotion } from '@/types/menu';

// T22.25 — a compact month calendar over the promotions list, so an operator can
// see at a glance which promotions run on which dates and where they overlap
// (Google-Calendar style spanning bars rather than per-day chips).
//
// Layout: weeks start Monday. Within each week a promotion becomes one bar
// spanning the days it covers; bars are packed into lanes so overlapping
// promotions stack instead of colliding.

interface PromotionCalendarProps {
  promotions: Promotion[];
  locale?: 'ka' | 'en' | 'ru';
}

const DAY_LABELS: Record<string, string[]> = {
  ka: ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვ'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

const BAR_TONES = [
  'bg-[#B8633D]',
  'bg-[#7A8C5F]',
  'bg-[#5D7A91]',
  'bg-[#B8423D]',
  'bg-[#8C6F9E]',
] as const;

/** Midnight of the given date, in local time (calendar cells are date-only). */
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Monday-based weekday index (Mon = 0 … Sun = 6). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface Bar {
  id: string;
  title: string;
  startCol: number; // 0-6
  span: number; // 1-7
  lane: number;
  tone: string;
  continuesLeft: boolean;
  continuesRight: boolean;
}

export function PromotionCalendar({ promotions, locale = 'ka' }: PromotionCalendarProps) {
  const today = useMemo(() => atMidnight(new Date()), []);
  const [monthAnchor, setMonthAnchor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const { weeks, barsByWeek } = useMemo(() => {
    const firstOfMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const gridStart = addDays(firstOfMonth, -mondayIndex(firstOfMonth));

    // 6 weeks always → stable height, no layout jump between months.
    const weekList: Date[][] = Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)),
    );

    // Only promotions with a usable range, in a stable order.
    const ranges = promotions
      .map((p, i) => ({
        id: p.id,
        title: p.titleKa,
        from: atMidnight(new Date(p.startDate)),
        to: atMidnight(new Date(p.endDate)),
        tone: BAR_TONES[i % BAR_TONES.length],
      }))
      .filter((r) => !Number.isNaN(r.from.getTime()) && !Number.isNaN(r.to.getTime()))
      .filter((r) => r.to >= r.from);

    const perWeek: Bar[][] = weekList.map((week) => {
      const weekStart = week[0];
      const weekEnd = week[6];
      const lanes: Array<Array<[number, number]>> = [];
      const bars: Bar[] = [];

      for (const r of ranges) {
        if (r.to < weekStart || r.from > weekEnd) continue;

        const startCol = r.from <= weekStart ? 0 : mondayIndex(r.from);
        const endCol = r.to >= weekEnd ? 6 : mondayIndex(r.to);
        const span = endCol - startCol + 1;

        // First lane with no horizontal overlap.
        let lane = lanes.findIndex(
          (occupied) => !occupied.some(([s, e]) => startCol <= e && endCol >= s),
        );
        if (lane === -1) {
          lanes.push([]);
          lane = lanes.length - 1;
        }
        lanes[lane].push([startCol, endCol]);

        bars.push({
          id: r.id,
          title: r.title,
          startCol,
          span,
          lane,
          tone: r.tone,
          continuesLeft: r.from < weekStart,
          continuesRight: r.to > weekEnd,
        });
      }
      return bars;
    });

    return { weeks: weekList, barsByWeek: perWeek };
  }, [monthAnchor, promotions]);

  const monthLabel = new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : locale, {
    month: 'long',
    year: 'numeric',
  }).format(monthAnchor);

  const shiftMonth = (delta: number) =>
    setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <section
      className="mb-5 rounded-xl border border-border bg-card p-4"
      data-testid="promotion-calendar"
    >
      <header className="mb-3 flex items-center justify-between">
        <h3
          className="text-[13px] font-semibold capitalize text-text-default"
          data-testid="promotion-calendar-month"
        >
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            data-testid="promotion-calendar-prev"
            className="rounded-md p-1 text-text-muted hover:bg-chip"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonthAnchor(new Date(today.getFullYear(), today.getMonth(), 1))}
            data-testid="promotion-calendar-today"
            className="rounded-md px-2 py-0.5 text-[11.5px] font-medium text-text-muted hover:bg-chip"
          >
            {locale === 'ka' ? 'დღეს' : locale === 'ru' ? 'Сегодня' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            data-testid="promotion-calendar-next"
            className="rounded-md p-1 text-text-muted hover:bg-chip"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS[locale].map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-[10.5px] font-semibold uppercase tracking-[0.3px] text-text-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-1">
        {weeks.map((week, wi) => {
          const bars = barsByWeek[wi];
          const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);
          return (
            <div key={wi} className="relative">
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const inMonth = day.getMonth() === monthAnchor.getMonth();
                  const isToday = sameDay(day, today);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'rounded-md border p-1',
                        inMonth ? 'border-border-soft' : 'border-transparent',
                      )}
                      style={{ minHeight: `${28 + laneCount * 18}px` }}
                    >
                      <span
                        className={cn(
                          'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-[10.5px] tabular-nums',
                          isToday && 'bg-text-default font-bold text-white',
                          !isToday && inMonth && 'text-text-default',
                          !inMonth && 'text-text-subtle',
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Spanning promotion bars */}
              {bars.map((bar) => (
                <div
                  key={`${bar.id}-${wi}`}
                  data-testid={`promotion-calendar-bar-${bar.id}`}
                  title={bar.title}
                  className={cn(
                    'pointer-events-none absolute flex items-center overflow-hidden px-1.5 text-[10px] font-semibold text-white',
                    bar.tone,
                    bar.continuesLeft ? 'rounded-l-none' : 'rounded-l',
                    bar.continuesRight ? 'rounded-r-none' : 'rounded-r',
                  )}
                  style={{
                    left: `calc(${(bar.startCol / 7) * 100}% + 2px)`,
                    width: `calc(${(bar.span / 7) * 100}% - 4px)`,
                    top: `${24 + bar.lane * 18}px`,
                    height: '15px',
                  }}
                >
                  <span className="truncate">{bar.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
