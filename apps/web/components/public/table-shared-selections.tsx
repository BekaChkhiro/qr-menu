'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import {
  useTableMode,
  type SharedTableSelection,
  type TableGuestInfo,
} from './table-mode-provider';
import type { TrayProductInfo } from './table-guest-tray';

interface Props {
  products: TrayProductInfo[];
  locale: Locale;
  className?: string;
  // Optional overrides if used standalone or with custom data
  guests?: TableGuestInfo[];
  selections?: SharedTableSelection[];
}

const COPY: Record<
  Locale,
  {
    guestsHeading: (count: number) => string;
    hostBadge: string;
    selectionEmpty: string;
    overallEmpty: string;
  }
> = {
  ka: {
    guestsHeading: (n) => `სტუმრები · ${n}`,
    hostBadge: 'მასპინძელი',
    selectionEmpty: 'ამ სტუმარს არჩევანი ჯერ არ აქვს',
    overallEmpty: 'მაგიდის მონაწილეებს არჩევანი ჯერ არ დაუმატებიათ.',
  },
  en: {
    guestsHeading: (n) => `Guests · ${n}`,
    hostBadge: 'Host',
    selectionEmpty: 'No picks yet from this guest',
    overallEmpty: 'No one at the table has picked anything yet.',
  },
  ru: {
    guestsHeading: (n) => `Гости · ${n}`,
    hostBadge: 'Хост',
    selectionEmpty: 'У этого гостя пока нет выбора',
    overallEmpty: 'Никто за столом пока ничего не выбрал.',
  },
};

function pickName<T extends { nameKa: string; nameEn: string | null; nameRu: string | null }>(
  entity: T,
  locale: Locale,
): string {
  switch (locale) {
    case 'en':
      return entity.nameEn || entity.nameKa;
    case 'ru':
      return entity.nameRu || entity.nameKa;
    default:
      return entity.nameKa;
  }
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function TableSharedSelections({
  products,
  locale,
  className,
  guests: guestsOverride,
  selections: selectionsOverride,
}: Props) {
  const tableMode = useTableMode();
  const copy = COPY[locale];

  const guests = guestsOverride ?? tableMode?.guests ?? [];
  const sharedSelections = selectionsOverride ?? tableMode?.sharedSelections ?? [];

  const productById = useMemo(() => {
    const map = new Map<string, TrayProductInfo>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const variationById = useMemo(() => {
    const map = new Map<string, TrayProductInfo['variations'][number]>();
    for (const p of products) {
      for (const v of p.variations) map.set(v.id, v);
    }
    return map;
  }, [products]);

  const selectionsByGuest = useMemo(() => {
    const map = new Map<string, SharedTableSelection[]>();
    for (const s of sharedSelections) {
      const arr = map.get(s.guestId) ?? [];
      arr.push(s);
      map.set(s.guestId, arr);
    }
    return map;
  }, [sharedSelections]);

  const totalSelectionCount = sharedSelections.length;

  return (
    <div
      className={cn('flex flex-col', className)}
      data-testid="public-table-shared-selections"
    >
      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-text-muted">
        {copy.guestsHeading(guests.length)}
      </h2>

      {totalSelectionCount === 0 && (
        <p
          className="mb-4 rounded-[12px] border border-dashed border-border bg-card px-4 py-6 text-center text-[13px] text-text-muted"
          data-testid="public-table-shared-empty"
        >
          {copy.overallEmpty}
        </p>
      )}

      <ul className="flex flex-col gap-3" data-testid="public-table-shared-guests">
        {guests.map((guest) => {
          const guestSelections = selectionsByGuest.get(guest.id) ?? [];
          return (
            <li
              key={guest.id}
              className="rounded-[12px] border border-border bg-card p-4"
              data-testid="public-table-shared-guest-card"
              data-guest-id={guest.id}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-[13px] font-semibold text-text-default">
                  {getInitial(guest.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-text-default">
                    {guest.name}
                    {guest.isHost && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-text-default/10 px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-text-default">
                        <Crown size={10} strokeWidth={1.5} aria-hidden="true" />
                        {copy.hostBadge}
                      </span>
                    )}
                  </p>
                </div>
                <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-text-muted">
                  {guestSelections.length}
                </span>
              </div>

              {guestSelections.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-text-muted">
                  {copy.selectionEmpty}
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {guestSelections.map((sel) => {
                    const product = productById.get(sel.productId);
                    const variation = sel.variationId
                      ? variationById.get(sel.variationId)
                      : null;
                    const productName = product
                      ? pickName(product, locale)
                      : sel.productId;
                    const variationName = variation
                      ? pickName(variation, locale)
                      : null;

                    return (
                      <li
                        key={sel.id}
                        data-testid="public-table-shared-selection-row"
                        data-selection-id={sel.id}
                        className="flex items-center gap-3 rounded-[10px] border border-border bg-bg px-3 py-2"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-chip">
                          {product?.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-text-default">
                            {productName}
                          </p>
                          <p className="text-[11.5px] text-text-muted">
                            {variationName ? `${variationName} · ` : ''}×
                            {sel.quantity}
                          </p>
                          {sel.note && (
                            <p className="mt-0.5 line-clamp-2 text-[11.5px] text-text-muted">
                              “{sel.note}”
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
