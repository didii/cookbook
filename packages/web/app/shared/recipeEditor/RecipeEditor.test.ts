import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyDraftSeed, isDirty, startingDraft } from '~/lib/draft';
import { asksBeforeLeaving, draftKey, saveDraft, type DraftStorage } from '~/lib/draftStore';

const content = { ...emptyDraftSeed, title: 'Soep', author: 'Oma' };
const stored = startingDraft(content);
const key = draftKey('oma@example.com', 'soep');
/** A storage that refuses every write, as a full one does. */
const fakeFullStorage: DraftStorage = {
  length: 0,
  key: () => null,
  getItem: () => null,
  setItem: () => {
    throw new Error('full');
  },
  removeItem: () => undefined,
};

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
test('recipe-form › Reset hidden without changes', () => assert.equal(isDirty(stored, startingDraft(content)), false));

test('recipe-form › Reset restores the starting values', () => {
  const edited = { ...stored, title: 'Stamppot', intro: 'x' };
  assert.equal(isDirty(stored, edited), true);
  const reset = startingDraft(content);
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

// The confirmation itself (following a link) needs a browser; whether it is asked is decided by asksBeforeLeaving.
test('recipe-form › Leaving when the draft could not be kept asks first', () => {
  const full = (state: typeof stored) =>
    saveDraft(fakeFullStorage, key, { state, initial: stored, base: {}, uploading: false, settledImage: '', now: new Date() });
  const edited = { ...stored, title: 'Stamppot' };
  assert.equal(
    asksBeforeLeaving({ dirty: true, submitting: false }, () => full(edited).ok),
    true,
  );
  assert.equal(
    asksBeforeLeaving({ dirty: true, submitting: false }, () => false),
    true,
  );
});

test('recipe-form › Leaving with a kept draft does not ask', () => {
  let storedValue = '';
  const storage = { ...fakeFullStorage, setItem: (_: string, v: string) => void (storedValue = v) };
  const edited = { ...stored, title: 'Stamppot' };
  const keep = () => saveDraft(storage, key, { state: edited, initial: stored, base: {}, uploading: false, settledImage: '', now: new Date() }).ok;
  assert.equal(asksBeforeLeaving({ dirty: true, submitting: false }, keep), false);
  assert.ok(storedValue, 'the changes are on the device when the page is left');
});
test('recipe-form › Leaving without changes does not ask', () => {
  const never = () => assert.fail('nothing to keep');
  assert.equal(asksBeforeLeaving({ dirty: false, submitting: false }, never), false);
  // Saving: the form is submitted, so nothing is asked even though the editor still differs from the stored recipe.
  assert.equal(asksBeforeLeaving({ dirty: true, submitting: true }, never), false);
});
