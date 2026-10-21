// T1.5 — the promotion drawer's "Limit to specific dates" switch.
//
// Safari/WebKit draws today's date inside an empty <input type="date">, so a
// switch turned ON with both fields empty looked filled while the form value was
// null. When the switch turns ON with no dates, the drawer prefills a sensible
// range instead: today through today + 7 days. Dates are UTC-midnight values built
// from the browser's calendar day, because the date inputs read and write them
// with toISOString() — this keeps the shown value equal to the form value.

export const DEFAULT_DATE_RANGE_DAYS = 7;

export function defaultDateRange(now: Date = new Date()): { startDate: Date; endDate: Date } {
  const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const endDate = new Date(startDate.getTime() + DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}
