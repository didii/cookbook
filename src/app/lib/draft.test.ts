import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultRules } from '~app/lib/rules';
import type { Chip } from './chips';
import {
  addStep,
  editedStep,
  editStep,
  emptyDraftSeed,
  isDirty,
  moveIngredient,
  moveStep,
  removeIngredient,
  removeStep,
  restoreStep,
  startingDraft,
  storedSteps,
  typeIngredient,
  type RecipeDraft,
} from './draft';
import { computeEdit } from './textEdit';

const emptyDraft = startingDraft(defaultRules);
const content = { ...emptyDraftSeed, title: 'Soep', author: 'Oma' };
const stored = startingDraft(defaultRules, content);
const lines = (d: { ingredients: { text: string }[] }) => d.ingredients.map((r) => r.text);
const withLines = (...texts: string[]) => startingDraft(defaultRules, { ...content, ingredients: texts });

test('equal drafts are not dirty', () => assert.equal(isDirty(stored, { ...stored }, defaultRules), false));

test('a changed field is dirty', () => assert.equal(isDirty(stored, { ...stored, time: '1 uur' }, defaultRules), true));

test('a whitespace-only difference is not dirty', () => assert.equal(isDirty(stored, { ...stored, title: ' Soep ' }, defaultRules), false));

test('reverting a change is not dirty again', () => {
  const changed = { ...stored, intro: 'x' };
  assert.equal(isDirty(stored, changed, defaultRules), true);
  assert.equal(isDirty(stored, { ...changed, intro: '' }, defaultRules), false);
});

test('the starting draft is the stored values, or empty', () => {
  assert.deepEqual(startingDraft(defaultRules, content), stored);
  assert.deepEqual(startingDraft(defaultRules), emptyDraft);
  assert.deepEqual(lines(stored), ['']);
});

test('recipe-ingredient-editing › Empty row at the end', () => {
  assert.deepEqual(lines(emptyDraft), ['']);
  assert.deepEqual(lines(withLines('bloem', 'zout')), ['bloem', 'zout', '']);
});

test('recipe-ingredient-editing › Typing adds the next row', () => {
  const draft = typeIngredient(emptyDraft, emptyDraft.ingredients[0].id, '1 ei', defaultRules);
  assert.deepEqual(lines(draft), ['1 ei', '']);
  assert.notEqual(draft.ingredients[0].id, draft.ingredients[1].id);
});

test('clearing the last filled row keeps that row and one empty row', () => {
  const draft = withLines('a', 'b');
  const cleared = typeIngredient(draft, draft.ingredients[1].id, '', defaultRules);
  assert.deepEqual(lines(cleared), ['a', '']);
  assert.equal(cleared.ingredients[1].id, draft.ingredients[1].id);
});

test('recipe-ingredient-editing › Row can be removed', () => {
  const draft = withLines('a', 'b', 'c');
  assert.deepEqual(lines(removeIngredient(draft, draft.ingredients[1].id, defaultRules)), ['a', 'c', '']);
  assert.deepEqual(lines(removeIngredient(emptyDraft, emptyDraft.ingredients[0].id, defaultRules)), ['']);
});

test('recipe-ingredient-editing › Row moves up and down', () => {
  const draft = withLines('a', 'b', 'c');
  const [a, , c] = draft.ingredients;
  const up = moveIngredient(draft, c.id, 1, defaultRules);
  assert.deepEqual(lines(up), ['a', 'c', 'b', '']);
  assert.deepEqual(lines(moveIngredient(up, c.id, 2, defaultRules)), ['a', 'b', 'c', '']);
  assert.deepEqual(lines(moveIngredient(draft, a.id, 5, defaultRules)), ['b', 'c', 'a', '']);
  assert.equal(moveIngredient(draft, a.id, -1, defaultRules), draft);
  assert.equal(moveIngredient(draft, 'nope', 0, defaultRules), draft);
});

test('the empty row at the end is no change, a typed row is', () => {
  assert.equal(isDirty(withLines('a'), withLines('a'), defaultRules), false);
  assert.equal(isDirty(stored, typeIngredient(stored, stored.ingredients[0].id, '  ', defaultRules), defaultRules), false);
  assert.equal(isDirty(withLines('a'), withLines('a', 'b'), defaultRules), true);
  assert.equal(isDirty(withLines('a', 'b'), moveIngredient(withLines('a', 'b'), 'i1', 0, defaultRules), defaultRules), true);
});

const bodies = (d: { steps: { body: string }[] }) => d.steps.map((s) => s.body);
const withSteps = (...steps: string[]) => startingDraft(defaultRules, { ...content, steps: steps.map((body) => ({ body, ingredients: [] })) });

test('recipe-step-editing › New recipe starts with one empty step', () => {
  assert.deepEqual(bodies(emptyDraft), ['']);
});

test('recipe-step-editing › Empty step at the end', () => {
  assert.deepEqual(bodies(withSteps('a', 'b')), ['a', 'b', '']);
});

test('recipe-step-editing › Typing adds the next step', () => {
  const draft = editStep(emptyDraft, 's0', 'x');
  assert.deepEqual(bodies(draft), ['x', '']);
  assert.deepEqual(bodies(editStep(draft, 's1', 'y')), ['x', 'y', '']);
  // Clearing a step leaves a single empty one at the end.
  assert.deepEqual(bodies(editStep(editStep(draft, 's1', 'y'), 's1', '')), ['x', '']);
});

test('recipe-step-editing › Insert above a step', () => {
  const draft = withSteps('a', 'b');
  assert.deepEqual(bodies(addStep(draft, 1)), ['a', '', 'b', '']);
  assert.equal(new Set(addStep(draft, 1).steps.map((s) => s.id)).size, 4);
});

test('recipe-step-editing › Insert before the first step', () => {
  assert.deepEqual(bodies(addStep(withSteps('a'), 0)), ['', 'a', '']);
});

test('recipe-step-editing › Step moves up and down', () => {
  const draft = withSteps('a', 'b', 'c');
  const up = moveStep(draft, 's2', 1);
  assert.deepEqual(bodies(up), ['a', 'c', 'b', '']);
  assert.deepEqual(bodies(moveStep(up, 's2', 2)), ['a', 'b', 'c', '']);
  assert.deepEqual(bodies(moveStep(draft, 's0', 9)), ['b', 'c', 'a', '']);
  assert.equal(moveStep(draft, 's0', -1), draft);
  assert.equal(moveStep(emptyDraft, 's0', 0), emptyDraft);
  assert.equal(moveStep(draft, 'nope', 0), draft);
});

test('recipe-step-editing › Deleted step can be undone', () => {
  const draft = withSteps('a', 'b', 'c');
  const removed = draft.steps[1];
  const without = removeStep(draft, removed.id, defaultRules);
  assert.deepEqual(bodies(without), ['a', 'c', '']);
  // Meanwhile another step took the id of the removed one.
  const later = editStep(removeStep(draft, 's2', defaultRules), 's3', 'd');
  const restored = restoreStep(removeStep(later, 's1', defaultRules), removed, 1, defaultRules);
  assert.deepEqual(bodies(restored), ['a', 'b', 'd', '']);
  assert.equal(new Set(restored.steps.map((s) => s.id)).size, 4);
  assert.deepEqual(restoreStep(without, removed, 1, defaultRules), draft);
  // The only step with text leaves the empty step, which the restored step goes before.
  const only = withSteps('solo');
  const emptied = removeStep(only, 's0', defaultRules);
  assert.deepEqual(bodies(emptied), ['']);
  assert.deepEqual(restoreStep(emptied, only.steps[0], 0, defaultRules), only);
  assert.equal(isDirty(only, restoreStep(emptied, only.steps[0], 0, defaultRules), defaultRules), false);
});

test('recipe-step-editing › Deleting an empty step is immediate', () => {
  const draft = withSteps('a', '', 'c');
  assert.deepEqual(bodies(removeStep(draft, 's1', defaultRules)), ['a', 'c', '']);
  assert.deepEqual(bodies(removeStep(emptyDraft, 's0', defaultRules)), ['']);
});

test('recipe-step-editing › Deleting the last step with text leaves the empty step', () => {
  assert.deepEqual(bodies(removeStep(withSteps('solo'), 's0', defaultRules)), ['']);
});

test('empty steps are no change, a typed or moved step is', () => {
  const draft = withSteps('a', 'b');
  assert.equal(isDirty(draft, addStep(draft), defaultRules), false);
  assert.equal(isDirty(draft, editStep(draft, 's0', ' a '), defaultRules), false);
  assert.equal(isDirty(draft, editStep(draft, 's0', 'x'), defaultRules), true);
  assert.equal(isDirty(draft, moveStep(draft, 's0', 1), defaultRules), true);
  assert.equal(isDirty(draft, removeStep(draft, 's1', defaultRules), defaultRules), true);
  assert.equal(isDirty(stored, addStep(stored), defaultRules), false);
});

/** Types into a step the way the editor reports it: the text, then what was replaced. */
const typeStep = (draft: RecipeDraft, id: string, body: string) => {
  const before = draft.steps.find((s) => s.id === id)!.body;
  return editedStep(draft, id, body, computeEdit(before, body), defaultRules);
};

test('recipe-step-chips › Chips travel with their step', () => {
  const draft = typeStep(withSteps('a', 'b'), 's1', 'Laat 30 minuten rusten');
  const timer = draft.steps[1].chips[0];
  assert.equal(timer.kind, 'timer');
  const moved = moveStep(draft, 's1', 0);
  assert.deepEqual(bodies(moved), ['Laat 30 minuten rusten', 'a', '']);
  assert.deepEqual(moved.steps[0].chips, draft.steps[1].chips);
  assert.deepEqual(moved.steps[0].ghosts, draft.steps[1].ghosts);
  assert.equal(moved.steps[0].body.slice(timer.anchor!.start, timer.anchor!.end), '30 minuten');
});

test('typing in a step and in the ingredient list changes the chips', () => {
  let draft = startingDraft(defaultRules, { ...content, ingredients: ['250 g bloem'], steps: [{ body: '', ingredients: [] }] });
  draft = typeStep(draft, 's0', 'Zeef de bloem');
  assert.deepEqual(storedSteps(draft, defaultRules), [{ body: 'Zeef de bloem', ingredients: [{ quantityText: '250 g', name: 'bloem' }] }]);
  draft = typeIngredient(draft, 'i0', '300 g bloem', defaultRules);
  assert.equal(storedSteps(draft, defaultRules)[0].ingredients[0].quantityText, '300 g');
  draft = removeIngredient(draft, 'i0', defaultRules);
  assert.deepEqual(storedSteps(draft, defaultRules)[0].ingredients, []);
  assert.deepEqual(bodies(draft), ['Zeef de bloem', '']);
});

test('stored chips come back as chips, and chips count as a change', () => {
  const step = { body: 'Bak 30 minuten.', ingredients: [], timer: { minutes: 30, label: 'Bakken' } };
  const draft = startingDraft(defaultRules, { ...content, steps: [step] });
  assert.deepEqual(storedSteps(draft, defaultRules), [step]);
  assert.equal(isDirty(draft, startingDraft(defaultRules, { ...content, steps: [step] }), defaultRules), false);
  const pinned: RecipeDraft = {
    ...draft,
    steps: [{ ...draft.steps[0], chips: draft.steps[0].chips.map((c) => ({ ...c, mode: 'manual', values: { minutes: 40 } }) as Chip) }],
  };
  assert.equal(isDirty(draft, pinned, defaultRules), true);
  assert.equal(isDirty(draft, { ...draft, steps: [{ ...draft.steps[0], chips: [], ghosts: [] }] }, defaultRules), true);
});

test('an open proposed removal survives typing in another step', () => {
  const step = (body: string, ingredients = [{ quantityText: '250 g', name: 'bloem' }]) => ({ body, ingredients });
  let draft = startingDraft(defaultRules, { ...content, ingredients: ['250 g bloem'], steps: [step('Zeef de bloem'), step('a', [])] });
  const id = draft.steps[0].chips[0].id;
  draft = { ...draft, steps: [{ ...draft.steps[0], chips: [{ ...draft.steps[0].chips[0], mode: 'manual' }] }, draft.steps[1]] };
  draft = typeStep(draft, 's0', 'Zeef de pasta');
  draft = typeStep(draft, 's1', 'ab');
  const chip = draft.steps[0].chips.find((c) => c.id === id)!;
  assert.equal(chip.rowId, 'i0');
  assert.notEqual(chip.anchor, undefined);
});
