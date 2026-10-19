import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyDraft, isDirty, startingDraft } from '~/lib/draft';

const stored = { ...emptyDraft, title: 'Soep', author: 'Oma' };

// Needs a browser: the layout at a wide width.
test.todo('recipe-form › Wide screen layout');
// Needs a browser: the layout at a phone width.
test.todo('recipe-form › Narrow screen layout');
// Needs a browser: a fixed bar while scrolling.
test.todo('recipe-form › Save bar stays in view');
// Needs a browser and a pending response.
test.todo('recipe-form › Save is busy while storing');
// Needs a browser: clicking the link and checking the navigation.
test.todo('recipe-form › Cancel leaves without storing');

// The bar shows "Herstel" and "Niet opgeslagen" exactly while isDirty is true.
test('recipe-form › Reset hidden without changes', () => assert.equal(isDirty(stored, startingDraft(stored)), false));

test('recipe-form › Reset restores the starting values', () => {
  const edited = { ...stored, title: 'Stamppot', intro: 'x' };
  assert.equal(isDirty(stored, edited), true);
  const reset = startingDraft(stored);
  assert.deepEqual(reset, stored);
  assert.equal(isDirty(stored, reset), false);
});

test('recipe-form › Unsaved indicator', () => {
  assert.equal(isDirty(stored, { ...stored, time: '1 uur' }), true);
  assert.equal(isDirty(stored, { ...stored, time: '' }), false);
});

// Needs a browser: the inline question and its focus.
test.todo('recipe-form › Reset asks first');
// Needs a browser: answering "Nee" and pressing Esc.
test.todo('recipe-form › Reset can be declined');
