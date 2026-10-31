export const expiryChoices = [
  { value: '24h', label: '24 uur' },
  { value: '7d', label: '7 dagen' },
  { value: '1m', label: '1 maand' },
  { value: '6m', label: '6 maanden' },
  { value: '1y', label: '1 jaar' },
  { value: 'never', label: 'Nooit' },
] as const;

export type ExpiryChoice = (typeof expiryChoices)[number]['value'];

export const isExpiryChoice = (value: unknown): value is ExpiryChoice => expiryChoices.some((c) => c.value === value);

const hour = 3_600_000;

/** `now` plus whole calendar months (in UTC), ending on the last day of the target month when that day does not exist there. */
function addMonths(now: Date, months: number) {
  const date = new Date(now);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  return date;
}

/** A moment as stored: ISO-8601 UTC, whole seconds. */
export const stored = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

/** The end date for a choice made at `now`, as stored; null for "never". */
export function expiryFor(choice: ExpiryChoice, now: Date): string | null {
  const end = {
    '24h': () => new Date(now.getTime() + 24 * hour),
    '7d': () => new Date(now.getTime() + 7 * 24 * hour),
    '1m': () => addMonths(now, 1),
    '6m': () => addMonths(now, 6),
    '1y': () => addMonths(now, 12),
    never: () => undefined,
  }[choice]();
  return end ? stored(end) : null;
}
