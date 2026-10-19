import { classifyStored, reconcile, rowsOf, toStored, type Context, type StepChips } from '~/lib/chips';
import type { Step } from '~/lib/recipes';
import type { TextEdit } from '~/lib/textEdit';
import type { Values } from '~/shared/recipeValidation';

/** One ingredient line in the editor. The id is only a stable key for focus and drag; it is never posted or stored. */
export type IngredientRow = { id: string; text: string };

/** One step in the editor: its text and its chips (see `lib/chips`). The id is only a stable key for focus and drag; it is never posted or stored. */
export type StepRow = StepChips & { id: string };

/** What the routes hand the editor: the fields, the ingredient lines as plain text and the steps as they are stored. */
export type Content = Values & { ingredients: string[]; steps: Step[] };

/** The editor's content. */
export type Draft = Values & { ingredients: IngredientRow[]; steps: StepRow[] };

export const emptyContent: Content = { title: '', author: '', servings: '', time: '', intro: '', image: '', ingredients: [], steps: [] };

/** The steps, but never none: a recipe being written always has a step to type in. */
const newStep = (id: string): StepRow => ({ id, body: '', chips: [], ghosts: [] });
const withOneStep = (steps: StepRow[]): StepRow[] => (steps.length ? steps : [newStep('s0')]);

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

/** Brings the chips of every step in line with the texts of all steps and the ingredient list; `edited` is the step whose text was just edited, with the edit that its anchors have not followed yet. */
function reconcileSteps(draft: Draft, edited?: { id: string; edit: TextEdit }, rowsChanged = false): Draft {
  const contexts = stepContexts(draft);
  return { ...draft, steps: draft.steps.map((s, i) => reconcile(s, contexts[i], edited?.id === s.id ? edited.edit : undefined, rowsChanged)) };
}

const setRows = (draft: Draft, rows: IngredientRow[]): Draft => reconcileSteps({ ...draft, ingredients: withFreeRow(rows) }, undefined, true);

/** The starting draft: the stored content when there is any, otherwise empty. Stored chips are tied to their words again. */
export function startingDraft(stored: Content = emptyContent): Draft {
  const ingredients = withFreeRow(stored.ingredients.map((text, i) => ({ id: `i${i}`, text })));
  const ctx = { rows: rowsOf(ingredients) };
  const steps = stored.steps.map((step, i) => ({ id: `s${i}`, ...classifyStored(step, ctx) }));
  return { ...stored, ingredients, steps: withOneStep(steps) };
}

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

/** An id no step has. */
const freeStepId = (steps: StepRow[]) => `s${Math.max(-1, ...steps.map((s) => Number(s.id.slice(1)))) + 1}`;

const blankStep = (step: StepRow) => !step.body.trim();

/** Adds an empty step at a place (the end when omitted). */
export function addStep(draft: Draft, at = draft.steps.length): Draft {
  const steps = [...draft.steps];
  steps.splice(Math.min(Math.max(at, 0), steps.length), 0, newStep(freeStepId(steps)));
  return { ...draft, steps };
}

/** Sets the text of a step, nothing else: the chips follow when the edit is reported (`editedStep`), which for a composition happens once when it ends. */
export const editStep = (draft: Draft, id: string, body: string): Draft => ({
  ...draft,
  steps: draft.steps.map((s) => (s.id === id ? { ...s, body } : s)),
});

/** A step's text became `body` by an edit: its chips follow the words by the edit. */
export const editedStep = (draft: Draft, id: string, body: string, edit: TextEdit): Draft => reconcileSteps(editStep(draft, id, body), { id, edit });

/** Removes a step; the last one is replaced by an empty step. */
export const removeStep = (draft: Draft, id: string): Draft =>
  reconcileSteps({ ...draft, steps: withOneStep(draft.steps.filter((s) => s.id !== id)) });

/** Moves a step to a place in the list. Unknown ids and no-op moves return the draft as it was. */
export function moveStep(draft: Draft, id: string, to: number): Draft {
  const from = draft.steps.findIndex((s) => s.id === id);
  const target = Math.min(Math.max(to, 0), draft.steps.length - 1);
  if (from < 0 || target === from) return draft;
  const steps = [...draft.steps];
  steps.splice(target, 0, ...steps.splice(from, 1));
  return { ...draft, steps };
}

/** Puts a removed step back at the place it had. Only an untouched empty step (what removing the last one leaves) makes room for it; the id changes if another step took it meanwhile. */
export function restoreStep(draft: Draft, step: StepRow, at: number): Draft {
  const steps = draft.steps.length === 1 && blankStep(draft.steps[0]) ? [] : [...draft.steps];
  steps.splice(Math.min(Math.max(at, 0), steps.length), 0, steps.some((s) => s.id === step.id) ? { ...step, id: freeStepId(steps) } : step);
  return reconcileSteps({ ...draft, steps });
}

/** What each step's chips are read against (see `lib/chips`). */
export function stepContexts(draft: Draft): Context[] {
  const ctx = { rows: rowsOf(draft.ingredients) };
  return draft.steps.map(() => ctx);
}

/** The steps as they are posted and stored: their text and the chips as they stand (see `toStored`). */
export function storedSteps(draft: Draft): Step[] {
  const contexts = stepContexts(draft);
  return draft.steps.map((s, i) => toStored(s, contexts[i]));
}

/** Changes the chips of one step (pinning, removing, accepting a proposal, …) with a function of the chip logic. */
export const changeChips = (draft: Draft, id: string, change: (step: StepRow, context: Context) => StepRow): Draft => {
  const contexts = stepContexts(draft);
  return { ...draft, steps: draft.steps.map((s, i) => (s.id === id ? change(s, contexts[i]) : s)) };
};

/** Only what is stored matters: no ids, no blank rows, no surrounding whitespace. */
const normalize = (draft: Draft) =>
  JSON.stringify(
    {
      ...draft,
      ingredients: draft.ingredients.filter((r) => !blank(r)).map((r) => r.text),
      steps: storedSteps(draft).filter((s) => s.body.trim()),
    },
    (_, v) => (typeof v === 'string' ? v.trim() : v),
  );

/** Whether the draft differs from where it started; surrounding whitespace and the empty row at the end are not a difference. */
export const isDirty = (initial: Draft, current: Draft) => normalize(initial) !== normalize(current);
