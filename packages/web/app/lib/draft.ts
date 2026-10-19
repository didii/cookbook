import type { Values } from '~/shared/recipeValidation';

/** One ingredient line in the editor. The id is only a stable key for focus and drag; it is never posted or stored. */
export type IngredientRow = { id: string; text: string };

/** What the routes hand the editor: the fields and the ingredient lines as plain text. */
export type Content = Values & { ingredients: string[] };

/** The editor's content. Later changes add keys (steps). */
export type Draft = Values & { ingredients: IngredientRow[] };

export const emptyContent: Content = { title: '', author: '', servings: '', time: '', intro: '', image: '', ingredients: [] };

const blank = (row: IngredientRow) => !row.text.trim();

/** Keeps exactly one empty row at the end: adds one after the last filled row, and drops a surplus empty one at the end (the earlier one, which may have focus, stays). */
export function withFreeRow(rows: IngredientRow[]): IngredientRow[] {
  const next = [...rows];
  while (next.length > 1 && blank(next[next.length - 1]) && blank(next[next.length - 2])) next.pop();
  if (!next.length || !blank(next[next.length - 1])) next.push({ id: freeId(next), text: '' });
  return next;
}

/** An id no row of the list has. */
const freeId = (rows: IngredientRow[]) => `i${Math.max(-1, ...rows.map((r) => Number(r.id.slice(1)))) + 1}`;

const setRows = (draft: Draft, rows: IngredientRow[]): Draft => ({ ...draft, ingredients: withFreeRow(rows) });

/** The starting draft: the stored content when there is any, otherwise empty. */
export const startingDraft = (stored: Content = emptyContent): Draft => ({
  ...stored,
  ingredients: withFreeRow(stored.ingredients.map((text, i) => ({ id: `i${i}`, text }))),
});

export const emptyDraft: Draft = startingDraft();

/** Sets the text of a row; typing in the empty last row adds the next one. */
export const typeIngredient = (draft: Draft, id: string, text: string): Draft =>
  setRows(
    draft,
    draft.ingredients.map((r) => (r.id === id ? { ...r, text } : r)),
  );

/** Removes a row; the other rows keep their order. */
export const removeIngredient = (draft: Draft, id: string): Draft =>
  setRows(
    draft,
    draft.ingredients.filter((r) => r.id !== id),
  );

/** Moves a row to a place in the list; the empty row at the end is not a place to move to. Unknown ids and no-op moves return the draft as it was. */
export function moveIngredient(draft: Draft, id: string, to: number): Draft {
  const from = draft.ingredients.findIndex((r) => r.id === id);
  const target = Math.min(Math.max(to, 0), draft.ingredients.length - 2);
  if (from < 0 || target < 0 || target === from) return draft;
  const rows = [...draft.ingredients];
  rows.splice(target, 0, ...rows.splice(from, 1));
  return setRows(draft, rows);
}

/** Only what is stored matters: no ids, no blank rows, no surrounding whitespace. */
const normalize = (draft: Draft) =>
  JSON.stringify({ ...draft, ingredients: draft.ingredients.filter((r) => !blank(r)).map((r) => r.text) }, (_, v) =>
    typeof v === 'string' ? v.trim() : v,
  );

/** Whether the draft differs from where it started; surrounding whitespace and the empty row at the end are not a difference. */
export const isDirty = (initial: Draft, current: Draft) => normalize(initial) !== normalize(current);
