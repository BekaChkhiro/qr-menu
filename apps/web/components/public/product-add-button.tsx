'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import { useTableMode } from './table-mode-provider';
import { getProductName, getVariationName, toNumber } from './product-card-shared';
import type { PublicProduct } from './product-card';
import { PriceTag } from './price-tag';

const COPY: Record<
  Locale,
  {
    add: string;
    adding: string;
    pickVariation: string;
    pickDescription: string;
    closed: string;
  }
> = {
  ka: {
    add: 'დამატება',
    adding: 'ემატება…',
    pickVariation: 'აირჩიე ვარიანტი',
    pickDescription: 'აირჩიე რომელი ვარიანტი დაამატო შენს არჩევანში.',
    closed: 'მაგიდა დახურულია',
  },
  en: {
    add: 'Add',
    adding: 'Adding…',
    pickVariation: 'Pick a variation',
    pickDescription: 'Choose which variation to add to your picks.',
    closed: 'Table closed',
  },
  ru: {
    add: 'Добавить',
    adding: 'Добавляем…',
    pickVariation: 'Выберите вариант',
    pickDescription: 'Выберите, какой вариант добавить в ваш список.',
    closed: 'Стол закрыт',
  },
};

interface Props {
  product: PublicProduct;
  locale: Locale;
  currencySymbol: string;
  className?: string;
  /**
   * Visual variant — `pill` is a rounded button (default for grid cards),
   * `compact` is a small "+" icon-only button used in dense rows.
   */
  size?: 'pill' | 'compact';
}

export function ProductAddButton({
  product,
  locale,
  currencySymbol,
  className,
  size = 'pill',
}: Props) {
  const tableMode = useTableMode();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submittingVariationId, setSubmittingVariationId] = useState<string | null>(null);
  const [submittingNoVariation, setSubmittingNoVariation] = useState(false);

  if (!tableMode) return null;

  const copy = COPY[locale];
  const hasVariations = product.variations.length > 0;
  const closed = tableMode.status !== 'OPEN';

  async function handleDirectAdd() {
    if (closed) return;
    setSubmittingNoVariation(true);
    await tableMode!.addSelection({ productId: product.id });
    setSubmittingNoVariation(false);
  }

  async function handlePickVariation(variationId: string) {
    setSubmittingVariationId(variationId);
    const ok = await tableMode!.addSelection({
      productId: product.id,
      variationId,
    });
    setSubmittingVariationId(null);
    if (ok) setPickerOpen(false);
  }

  if (size === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => (hasVariations ? setPickerOpen(true) : handleDirectAdd())}
          disabled={closed || submittingNoVariation}
          aria-label={closed ? copy.closed : copy.add}
          data-testid="public-product-add"
          data-product-id={product.id}
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-text-default text-card transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40',
            className,
          )}
        >
          {submittingNoVariation ? (
            <Loader2 size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
          )}
        </button>
        {hasVariations && (
          <VariationPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            product={product}
            locale={locale}
            copy={copy}
            currencySymbol={currencySymbol}
            submittingVariationId={submittingVariationId}
            onPick={handlePickVariation}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (hasVariations ? setPickerOpen(true) : handleDirectAdd())}
        disabled={closed || submittingNoVariation}
        data-testid="public-product-add"
        data-product-id={product.id}
        className={cn(
          'inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-text-default px-3.5 text-[12.5px] font-semibold text-card transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40',
          className,
        )}
      >
        {submittingNoVariation ? (
          <Loader2 size={14} strokeWidth={2} className="animate-spin" aria-hidden="true" />
        ) : (
          <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
        )}
        {submittingNoVariation ? copy.adding : closed ? copy.closed : copy.add}
      </button>
      {hasVariations && (
        <VariationPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          product={product}
          locale={locale}
          copy={copy}
          currencySymbol={currencySymbol}
          submittingVariationId={submittingVariationId}
          onPick={handlePickVariation}
        />
      )}
    </>
  );
}

interface VariationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: PublicProduct;
  locale: Locale;
  copy: (typeof COPY)[Locale];
  currencySymbol: string;
  submittingVariationId: string | null;
  onPick: (variationId: string) => void;
}

function VariationPicker({
  open,
  onOpenChange,
  product,
  locale,
  copy,
  currencySymbol,
  submittingVariationId,
  onPick,
}: VariationPickerProps) {
  const productName = getProductName(product, locale);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="public-product-variation-picker"
        className="max-h-[80vh] rounded-t-2xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{productName}</SheetTitle>
          <SheetDescription>{copy.pickDescription}</SheetDescription>
        </SheetHeader>
        <ul className="mt-4 flex flex-col gap-2 overflow-y-auto pb-2">
          {product.variations.map((variation) => {
            const submitting = submittingVariationId === variation.id;
            return (
              <li key={variation.id}>
                <button
                  type="button"
                  onClick={() => onPick(variation.id)}
                  disabled={submitting}
                  data-testid="public-product-variation-option"
                  className="flex w-full items-center justify-between rounded-[12px] border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-chip disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-[14px] font-medium text-text-default">
                    {getVariationName(variation, locale)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <PriceTag
                      value={toNumber(variation.price) ?? 0}
                      symbol={currencySymbol}
                      size="text-[13px]"
                      weight="font-semibold"
                    />
                    {submitting ? (
                      <Loader2
                        size={14}
                        strokeWidth={2}
                        className="animate-spin text-text-muted"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        size={14}
                        strokeWidth={2.25}
                        className="text-text-muted"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
