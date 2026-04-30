'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2, LogOut, ShoppingBag, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import { useTableMode } from './table-mode-provider';
import { toNumber } from './product-card-shared';

export interface TrayProductInfo {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  price: number | string;
  imageUrl: string | null;
  variations: Array<{
    id: string;
    nameKa: string;
    nameEn: string | null;
    nameRu: string | null;
    price: number | string;
  }>;
}

interface Props {
  products: TrayProductInfo[];
  currencySymbol: string;
  locale: Locale;
}

const COPY: Record<
  Locale,
  {
    pillEmpty: string;
    pillCount: (n: number) => string;
    title: string;
    description: string;
    empty: string;
    total: string;
    estimateNote: string;
    leave: string;
    leaving: string;
    leaveConfirmTitle: string;
    leaveConfirmDesc: string;
    leaveConfirmCta: string;
    leaveConfirmCancel: string;
    closedHeading: string;
    expiredHeading: string;
  }
> = {
  ka: {
    pillEmpty: 'ჩემი არჩევანი',
    pillCount: (n) => `ჩემი არჩევანი · ${n}`,
    title: 'ჩემი არჩევანი',
    description: 'შენი დამატებული პროდუქტები ამ მაგიდისთვის.',
    empty: 'ჯერ არჩევანი არ გაქვს — დაამატე რამე მენიუდან.',
    total: 'სავარაუდო ჯამი',
    estimateNote: 'ფასები არიან საინფორმაციო — გადახდა ხდება ოფიციანტთან.',
    leave: 'მაგიდიდან გასვლა',
    leaving: 'გადის…',
    leaveConfirmTitle: 'მაგიდის დატოვება?',
    leaveConfirmDesc:
      'ჩემი არჩევანი წაიშლება და უნდა შეუერთდე ხელახლა PIN-ით.',
    leaveConfirmCta: 'დიახ, გავიდე',
    leaveConfirmCancel: 'გაუქმება',
    closedHeading: 'მაგიდა დახურულია',
    expiredHeading: 'მაგიდას ვადა გაუვიდა',
  },
  en: {
    pillEmpty: 'My picks',
    pillCount: (n) => `My picks · ${n}`,
    title: 'My picks',
    description: 'The items you added to this table.',
    empty: "You haven't picked anything yet — add something from the menu.",
    total: 'Total estimate',
    estimateNote: 'Prices are informational — payment happens with the server.',
    leave: 'Leave table',
    leaving: 'Leaving…',
    leaveConfirmTitle: 'Leave this table?',
    leaveConfirmDesc:
      "Your picks will be cleared and you'll need to rejoin with the PIN.",
    leaveConfirmCta: 'Yes, leave',
    leaveConfirmCancel: 'Cancel',
    closedHeading: 'Table closed',
    expiredHeading: 'Table expired',
  },
  ru: {
    pillEmpty: 'Мой выбор',
    pillCount: (n) => `Мой выбор · ${n}`,
    title: 'Мой выбор',
    description: 'Позиции, которые вы добавили к этому столу.',
    empty: 'Пока ничего не выбрано — добавьте что-нибудь из меню.',
    total: 'Примерный итог',
    estimateNote:
      'Цены информативны — оплата производится у официанта.',
    leave: 'Выйти из стола',
    leaving: 'Выходим…',
    leaveConfirmTitle: 'Выйти из стола?',
    leaveConfirmDesc:
      'Ваш выбор будет удалён и придётся войти заново по PIN-коду.',
    leaveConfirmCta: 'Да, выйти',
    leaveConfirmCancel: 'Отмена',
    closedHeading: 'Стол закрыт',
    expiredHeading: 'Срок стола истёк',
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

export function TableGuestTray({ products, currencySymbol, locale }: Props) {
  const tableMode = useTableMode();
  const [open, setOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

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

  if (!tableMode) return null;
  const copy = COPY[locale];

  const selections = tableMode.selections;
  const count = selections.length;

  const total = selections.reduce((acc, sel) => {
    const product = productById.get(sel.productId);
    if (!product) return acc;
    const variation = sel.variationId ? variationById.get(sel.variationId) : null;
    const unit = variation
      ? toNumber(variation.price) ?? 0
      : toNumber(product.price) ?? 0;
    return acc + unit * sel.quantity;
  }, 0);

  const closed = tableMode.status !== 'OPEN';
  const closedHeading =
    tableMode.status === 'EXPIRED' ? copy.expiredHeading : copy.closedHeading;

  return (
    <>
      {/* Floating pill — bottom-right above safe-area inset */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="public-table-guest-tray-pill"
        className={cn(
          'fixed right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-text-default px-5 text-[13.5px] font-semibold text-card shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]',
          'bottom-[calc(env(safe-area-inset-bottom)+1.25rem)]',
        )}
      >
        <ShoppingBag size={16} strokeWidth={1.75} aria-hidden="true" />
        {count > 0 ? copy.pillCount(count) : copy.pillEmpty}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          data-testid="public-table-guest-tray"
          className="flex max-h-[85vh] flex-col gap-0 rounded-t-2xl p-0"
        >
          <SheetHeader className="border-b border-border px-5 pb-4 pt-5 text-left">
            <SheetTitle>
              {closed ? closedHeading : copy.title}
              {!closed && count > 0 && (
                <span className="ml-2 text-[12px] font-medium text-text-muted">
                  · {count}
                </span>
              )}
            </SheetTitle>
            <SheetDescription>{copy.description}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {selections.length === 0 ? (
              <p
                className="rounded-[12px] border border-dashed border-border bg-bg px-4 py-6 text-center text-[13px] text-text-muted"
                data-testid="public-table-guest-tray-empty"
              >
                {copy.empty}
              </p>
            ) : (
              <ul
                className="flex flex-col gap-2"
                data-testid="public-table-guest-tray-list"
              >
                {selections.map((sel) => {
                  const product = productById.get(sel.productId);
                  if (!product) return null;
                  const variation = sel.variationId
                    ? variationById.get(sel.variationId)
                    : null;
                  const productName = pickName(product, locale);
                  const variationName = variation
                    ? pickName(variation, locale)
                    : null;
                  const unit = variation
                    ? toNumber(variation.price) ?? 0
                    : toNumber(product.price) ?? 0;
                  const lineTotal = unit * sel.quantity;
                  const removing = tableMode.removing.has(sel.id);
                  return (
                    <li
                      key={sel.id}
                      data-testid="public-table-guest-tray-item"
                      className="flex items-center gap-3 rounded-[12px] border border-border bg-card px-3 py-2.5"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-chip">
                        {product.imageUrl ? (
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
                        <p className="truncate text-[13.5px] font-medium text-text-default">
                          {productName}
                        </p>
                        <p className="text-[11.5px] text-text-muted">
                          {variationName ? `${variationName} · ` : ''}×
                          {sel.quantity}
                        </p>
                        {sel.note && (
                          <p className="mt-0.5 line-clamp-2 text-[11.5px] text-text-muted">
                            &ldquo;{sel.note}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className="text-[13px] font-semibold text-text-default"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {lineTotal.toFixed(2)}
                          {currencySymbol}
                        </span>
                        <button
                          type="button"
                          onClick={() => tableMode.removeSelection(sel.id)}
                          disabled={removing || closed}
                          aria-label="Remove"
                          data-testid="public-table-guest-tray-remove"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {removing ? (
                            <Loader2
                              size={12}
                              strokeWidth={2}
                              className="animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2
                              size={12}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border bg-card px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
            {selections.length > 0 && (
              <>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[12.5px] font-medium uppercase tracking-wide text-text-muted">
                    {copy.total}
                  </span>
                  <span
                    className="text-[16px] font-semibold text-text-default"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    data-testid="public-table-guest-tray-total"
                  >
                    {total.toFixed(2)}
                    {currencySymbol}
                  </span>
                </div>
                <p className="mb-3 text-[11px] text-text-muted">
                  {copy.estimateNote}
                </p>
              </>
            )}

            <button
              type="button"
              onClick={() => setConfirmLeaveOpen(true)}
              disabled={tableMode.leaving}
              data-testid="public-table-guest-tray-leave"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-card text-[13px] font-medium text-text-default transition-colors hover:bg-chip disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tableMode.leaving ? (
                <Loader2
                  size={14}
                  strokeWidth={2}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
              )}
              {tableMode.leaving ? copy.leaving : copy.leave}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmLeaveOpen}
        onOpenChange={(o) => {
          if (!tableMode.leaving) setConfirmLeaveOpen(o);
        }}
      >
        <AlertDialogContent data-testid="public-table-guest-tray-leave-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.leaveConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.leaveConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={tableMode.leaving}>
              {copy.leaveConfirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                tableMode.leave();
              }}
              disabled={tableMode.leaving}
              className="bg-danger text-card hover:bg-danger/90"
            >
              {tableMode.leaving ? (
                <Loader2
                  size={14}
                  strokeWidth={2}
                  className="mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {copy.leaveConfirmCta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
