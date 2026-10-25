'use client';

import { useTranslations } from 'next-intl';

import { summarizeCombo } from '@/lib/promotions/combo-summary';
import { cn } from '@/lib/utils';

// T1.9 — the "pick the dishes in this combo" checklist. Shared by the product
// drawer (COMBO type) and the promotion drawer's legacy COMBO rows, so both
// pick components the same way. Combos cannot include combos or themselves, so
// those are never offered here.

export interface ComboPickerProduct {
  id: string;
  nameKa: string;
  price: number | string;
  kind?: 'STANDARD' | 'COMBO';
}

interface ComboItemsPickerProps {
  products: ComboPickerProduct[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** The combo being edited; it can never be one of its own components. */
  excludeId?: string;
  emptyText: string;
  /** Prefix for data-testid on each row: `${prefix}-${productId}`. */
  testIdPrefix?: string;
  /** The combo's own price; when set, the summary shows the saving (T2.2). */
  comboPrice?: string | number | null;
}

export function ComboItemsPicker({
  products,
  value,
  onChange,
  excludeId,
  emptyText,
  testIdPrefix = 'combo-product',
  comboPrice,
}: ComboItemsPickerProps) {
  const t = useTranslations('admin.comboSummary');
  const choices = products.filter((p) => p.id !== excludeId && p.kind !== 'COMBO');
  const summary = summarizeCombo(
    choices.filter((p) => value.includes(p.id)),
    comboPrice
  );

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <div>
      <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-1.5">
        {choices.length === 0 && <div className="p-2 text-[12px] text-text-muted">{emptyText}</div>}
        {choices.map((p) => {
          const checked = value.includes(p.id);
          return (
            <label
              key={p.id}
              data-testid={`${testIdPrefix}-${p.id}`}
              data-checked={checked ? 'true' : 'false'}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                checked ? 'bg-accent-soft' : 'hover:bg-chip'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p.id)}
                className="h-4 w-4 accent-[hsl(var(--accent))]"
              />
              <span className="flex-1 text-text-default">{p.nameKa}</span>
              <span className="font-mono text-[12px] tabular-nums text-text-muted">
                {Number(p.price).toFixed(2)} ₾
              </span>
            </label>
          );
        })}
      </div>
      <div
        data-testid="combo-summary"
        className="mt-1.5 text-right font-mono text-[11.5px] tabular-nums text-text-muted"
      >
        {t('count', { count: summary.count })} · {t('total', { total: summary.total.toFixed(2) })}
        {summary.saving !== null && (
          <span className="text-text-default">
            {' · '}
            {t('saving', { saving: summary.saving.toFixed(2), percent: summary.percent ?? 0 })}
          </span>
        )}
      </div>
    </div>
  );
}
