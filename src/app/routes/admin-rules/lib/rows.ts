/** One row of a rules list. The id is only a stable key for focus and drag; it is never posted. Duration rows also have minutes (as typed) and "Vast". */
export type RuleItem = { id: string; text: string; minutes?: string; fixed?: boolean };

export const isEmptyItem = (row: RuleItem) => row.text.trim() === '' && !row.minutes?.trim();

/** The rows with an empty row at the end: a new one when the last row is filled in. */
export function ensureFree<T extends RuleItem>(rows: T[], blank: () => T): T[] {
  const last = rows.at(-1);
  return last && isEmptyItem(last) ? rows : [...rows, blank()];
}
