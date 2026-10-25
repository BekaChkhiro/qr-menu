// T2.2 — the live summary under the combo dish picker: how many dishes are
// picked, what they cost on their own, and what the combo price saves.

export interface ComboSummaryItem {
  price: number | string;
  quantity?: number;
}

export interface ComboSummary {
  count: number;
  total: number;
  /** Null until a usable combo price is entered. Never negative. */
  saving: number | null;
  /** Whole percent of `total`; null whenever `saving` is null. */
  percent: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const toNumber = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined || v === '') return NaN;
  return typeof v === 'number' ? v : Number(v);
};

export function summarizeCombo(
  items: ComboSummaryItem[],
  comboPrice?: number | string | null,
): ComboSummary {
  let sum = 0;
  for (const item of items) {
    const price = toNumber(item.price);
    const quantity = item.quantity ?? 1;
    if (Number.isFinite(price) && Number.isFinite(quantity)) sum += price * quantity;
  }
  const total = round2(sum);

  const combo = toNumber(comboPrice);
  if (!Number.isFinite(combo) || combo <= 0 || total <= 0) {
    return { count: items.length, total, saving: null, percent: null };
  }

  const saving = round2(Math.max(0, total - combo));
  return {
    count: items.length,
    total,
    saving,
    percent: Math.round((saving / total) * 100),
  };
}
