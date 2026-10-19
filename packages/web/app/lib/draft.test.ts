import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyContent, emptyDraft, isDirty, moveIngredient, removeIngredient, startingDraft, typeIngredient } from './draft';

const content = { ...emptyContent, title: 'Soep', author: 'Oma' };
const stored = startingDraft(content);
const lines = (d: { ingredients: { text: string }[] }) => d.ingredients.map((r) => r.text);
const withLines = (...texts: string[]) => startingDraft({ ...content, ingredients: texts });

test('equal drafts are not dirty', () => assert.equal(isDirty(stored, { ...stored }), false));

test('a changed field is dirty', () => assert.equal(isDirty(stored, { ...stored, time: '1 uur' }), true));

test('a whitespace-only difference is not dirty', () => assert.equal(isDirty(stored, { ...stored, title: ' Soep ' }), false));

test('reverting a change is not dirty again', () => {
  const changed = { ...stored, intro: 'x' };
  assert.equal(isDirty(stored, changed), true);
  assert.equal(isDirty(stored, { ...changed, intro: '' }), false);
});

test('the starting draft is the stored values, or empty', () => {
  assert.deepEqual(startingDraft(content), stored);
  assert.deepEqual(startingDraft(), emptyDraft);
  assert.deepEqual(lines(stored), ['']);
});

test('recipe-ingredient-editing › Empty row at the end', () => {
  assert.deepEqual(lines(emptyDraft), ['']);
  assert.deepEqual(lines(withLines('bloem', 'zout')), ['bloem', 'zout', '']);
});

test('recipe-ingredient-editing › Typing adds the next row', () => {
  const draft = typeIngredient(emptyDraft, emptyDraft.ingredients[0].id, '1 ei');
  assert.deepEqual(lines(draft), ['1 ei', '']);
  assert.notEqual(draft.ingredients[0].id, draft.ingredients[1].id);
});

test('clearing the last filled row keeps that row and one empty row', () => {
  const draft = withLines('a', 'b');
  const cleared = typeIngredient(draft, draft.ingredients[1].id, '');
  assert.deepEqual(lines(cleared), ['a', '']);
  assert.equal(cleared.ingredients[1].id, draft.ingredients[1].id);
});

test('recipe-ingredient-editing › Row can be removed', () => {
  const draft = withLines('a', 'b', 'c');
  assert.deepEqual(lines(removeIngredient(draft, draft.ingredients[1].id)), ['a', 'c', '']);
  assert.deepEqual(lines(removeIngredient(emptyDraft, emptyDraft.ingredients[0].id)), ['']);
});

test('recipe-ingredient-editing › Row moves up and down', () => {
  const draft = withLines('a', 'b', 'c');
  const [a, , c] = draft.ingredients;
  const up = moveIngredient(draft, c.id, 1);
  assert.deepEqual(lines(up), ['a', 'c', 'b', '']);
  assert.deepEqual(lines(moveIngredient(up, c.id, 2)), ['a', 'b', 'c', '']);
  assert.deepEqual(lines(moveIngredient(draft, a.id, 5)), ['b', 'c', 'a', '']);
  assert.equal(moveIngredient(draft, a.id, -1), draft);
  assert.equal(moveIngredient(draft, 'nope', 0), draft);
});

test('the empty row at the end is no change, a typed row is', () => {
  assert.equal(isDirty(withLines('a'), withLines('a')), false);
  assert.equal(isDirty(stored, typeIngredient(stored, stored.ingredients[0].id, '  ')), false);
  assert.equal(isDirty(withLines('a'), withLines('a', 'b')), true);
  assert.equal(isDirty(withLines('a', 'b'), moveIngredient(withLines('a', 'b'), 'i1', 0)), true);
});
