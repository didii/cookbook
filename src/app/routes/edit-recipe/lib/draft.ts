import type { Step } from '~app/shared/recipe';
import type { RecipeForm } from '~app/shared/recipeValidation';
import type { Rules } from '~app/shared/rules';
import { classifyStored, reconcile, rowsOf, toStored, type Context, type StepChips } from './chips';
import type { TextEdit } from './textEdit';

/** One ingredient line in the editor. The id is only a stable key for focus and drag; it is never posted or stored. */
export type IngredientLine = { id: string; text: string };

/** One step in the editor: its text and its chips (see `lib/chips`). The id is only a stable key for focus and drag; it is never posted or stored. */
export type StepDraft = StepChips & { id: string };

/** What the routes hand the editor: the fields, the ingredient lines as plain text and the steps as they are stored. */
export type DraftSeed = RecipeForm & { ingredients: string[]; steps: Step[] };

/** The editor's content. */
export type RecipeDraft = RecipeForm & { ingredients: IngredientLine[]; steps: StepDraft[] };

export const emptyDraftSeed: DraftSeed = { title: '', author: '', servings: '', time: '', intro: '', image: '', ingredients: [], steps: [] };

const newStep = (id: string): StepDraft => ({ id, body: '', chips: [], ghosts: [] });

/** An id no step has. */
const freeStepId = (steps: StepDraft[]) => `s${Math.max(-1, ...steps.map((s) => Number(s.id.slice(1)))) + 1}`;

const blankStep = (step: StepDraft) => !step.body.trim();

/** Keeps exactly one empty step at the end, like `withFreeRow` for ingredients: adds one after the last filled step, and drops a surplus empty one at the end (the earlier one, which may have focus, stays). */
function withFreeStep(steps: StepDraft[]): StepDraft[] {
  const next = [...steps];
  while (next.length > 1 && blankStep(next[next.length - 1]) && blankStep(next[next.length - 2])) next.pop();
  if (!next.length || !blankStep(next[next.length - 1])) next.push(newStep(freeStepId(next)));
  return next;
}

const blank = (row: IngredientLine) => !row.text.trim();

/** Keeps exactly one empty row at the end: adds one after the last filled row, and drops a surplus empty one at the end (the earlier one, which may have focus, stays). */
export function withFreeRow(rows: IngredientLine[]): IngredientLine[] {
  const next = [...rows];
  while (next.length > 1 && blank(next[next.length - 1]) && blank(next[next.length - 2])) next.pop();
  if (!next.length || !blank(next[next.length - 1])) next.push({ id: freeId(next), text: '' });
  return next;
}

/** An id no row of the list has. */
const freeId = (rows: IngredientLine[]) => `i${Math.max(-1, ...rows.map((r) => Number(r.id.slice(1)))) + 1}`;

/** Brings the chips of every step in line with the texts of all steps and the ingredient list; `edited` is the step whose text was just edited, with the edit that its anchors have not followed yet. */
function reconcileSteps(draft: RecipeDraft, rules: Rules, edited?: { id: string; edit: TextEdit }, rowsChanged = false): RecipeDraft {
  const contexts = stepContexts(draft, rules);
  return { ...draft, steps: draft.steps.map((s, i) => reconcile(s, contexts[i], edited?.id === s.id ? edited.edit : undefined, rowsChanged)) };
}

const setRows = (draft: RecipeDraft, rows: IngredientLine[], rules: Rules): RecipeDraft =>
  reconcileSteps({ ...draft, ingredients: withFreeRow(rows) }, rules, undefined, true);

/** The starting draft: the stored content when there is any, otherwise empty. Stored chips are tied to their words again. */
export function startingDraft(rules: Rules, stored: DraftSeed = emptyDraftSeed): RecipeDraft {
  const ingredients = withFreeRow(stored.ingredients.map((text, i) => ({ id: `i${i}`, text })));
  const ctx = { rows: rowsOf(ingredients, rules), rules };
  const steps = stored.steps.map((step, i) => ({ id: `s${i}`, ...classifyStored(step, ctx) }));
  return { ...stored, ingredients, steps: withFreeStep(steps) };
}

/** Sets the text of a row; typing in the empty last row adds the next one. */
export const typeIngredient = (draft: RecipeDraft, id: string, text: string, rules: Rules): RecipeDraft =>
  setRows(
    draft,
    draft.ingredients.map((r) => (r.id === id ? { ...r, text } : r)),
    rules,
  );

/** Removes a row; the other rows keep their order. */
export const removeIngredient = (draft: RecipeDraft, id: string, rules: Rules): RecipeDraft =>
  setRows(
    draft,
    draft.ingredients.filter((r) => r.id !== id),
    rules,
  );

/** Moves a row to a place in the list; the empty row at the end is not a place to move to. Unknown ids and no-op moves return the draft as it was. */
export function moveIngredient(draft: RecipeDraft, id: string, to: number, rules: Rules): RecipeDraft {
  const from = draft.ingredients.findIndex((r) => r.id === id);
  const target = Math.min(Math.max(to, 0), draft.ingredients.length - 2);
  if (from < 0 || target < 0 || target === from) return draft;
  const rows = [...draft.ingredients];
  rows.splice(target, 0, ...rows.splice(from, 1));
  return setRows(draft, rows, rules);
}

/** Adds an empty step at a place (the end when omitted). */
export function addStep(draft: RecipeDraft, at = draft.steps.length): RecipeDraft {
  const steps = [...draft.steps];
  steps.splice(Math.min(Math.max(at, 0), steps.length), 0, newStep(freeStepId(steps)));
  return { ...draft, steps };
}

/** Sets the text of a step; typing in the empty last step adds the next one. The chips follow when the edit is reported (`editedStep`), which for a composition happens once when it ends. */
export const editStep = (draft: RecipeDraft, id: string, body: string): RecipeDraft => ({
  ...draft,
  steps: withFreeStep(draft.steps.map((s) => (s.id === id ? { ...s, body } : s))),
});

/** A step's text became `body` by an edit: its chips follow the words by the edit. */
export const editedStep = (draft: RecipeDraft, id: string, body: string, edit: TextEdit, rules: Rules): RecipeDraft =>
  reconcileSteps(editStep(draft, id, body), rules, { id, edit });

/** Removes a step; the empty step at the end stays. */
export const removeStep = (draft: RecipeDraft, id: string, rules: Rules): RecipeDraft =>
  reconcileSteps({ ...draft, steps: withFreeStep(draft.steps.filter((s) => s.id !== id)) }, rules);

/** Moves a step to a place in the list; the empty step at the end is not a place to move to. Unknown ids and no-op moves return the draft as it was. */
export function moveStep(draft: RecipeDraft, id: string, to: number): RecipeDraft {
  const from = draft.steps.findIndex((s) => s.id === id);
  const target = Math.min(Math.max(to, 0), draft.steps.length - 2);
  if (from < 0 || target < 0 || target === from) return draft;
  const steps = [...draft.steps];
  steps.splice(target, 0, ...steps.splice(from, 1));
  return { ...draft, steps: withFreeStep(steps) };
}

/** Puts a removed step back at the place it had. Only a lone untouched empty step (what removing the only step with text leaves) makes room for it; the id changes if another step took it meanwhile. */
export function restoreStep(draft: RecipeDraft, step: StepDraft, at: number, rules: Rules): RecipeDraft {
  const steps = draft.steps.length === 1 && blankStep(draft.steps[0]) ? [] : [...draft.steps];
  steps.splice(Math.min(Math.max(at, 0), steps.length), 0, steps.some((s) => s.id === step.id) ? { ...step, id: freeStepId(steps) } : step);
  return reconcileSteps({ ...draft, steps: withFreeStep(steps) }, rules);
}

/** What each step's chips are read against (see `lib/chips`). */
export function stepContexts(draft: RecipeDraft, rules: Rules): Context[] {
  const ctx = { rows: rowsOf(draft.ingredients, rules), rules };
  return draft.steps.map(() => ctx);
}

/** The steps as they are posted and stored: their text and the chips as they stand (see `toStored`), without the empty ones. */
export function storedSteps(draft: RecipeDraft, rules: Rules): Step[] {
  const contexts = stepContexts(draft, rules);
  return draft.steps.flatMap((s, i) => (blankStep(s) ? [] : [toStored(s, contexts[i])]));
}

/** Changes the chips of one step (pinning, removing, accepting a proposal, …) with a function of the chip logic. */
export const changeChips = (draft: RecipeDraft, id: string, change: (step: StepDraft, context: Context) => StepDraft, rules: Rules): RecipeDraft => {
  const contexts = stepContexts(draft, rules);
  return { ...draft, steps: draft.steps.map((s, i) => (s.id === id ? change(s, contexts[i]) : s)) };
};

/** Only what is stored matters: no ids, no blank rows, no surrounding whitespace. */
const normalize = (draft: RecipeDraft, rules: Rules) =>
  JSON.stringify(
    {
      ...draft,
      ingredients: draft.ingredients.filter((r) => !blank(r)).map((r) => r.text),
      steps: storedSteps(draft, rules),
    },
    (_, v) => (typeof v === 'string' ? v.trim() : v),
  );

/** Whether the draft differs from where it started; surrounding whitespace and the empty row at the end are not a difference. */
export const isDirty = (initial: RecipeDraft, current: RecipeDraft, rules: Rules) => normalize(initial, rules) !== normalize(current, rules);
