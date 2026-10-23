import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultRules } from '~app/shared/rules';
import { emptyDraftSeed, isDirty, startingDraft } from './draft';
import { asksBeforeLeaving, draftKey, saveDraft, type DraftStorage } from './draftStore';

const content = { ...emptyDraftSeed, title: 'Soep', author: 'Oma' };
const stored = startingDraft(defaultRules, content);
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
describe('recipe-form › Reset hidden without changes', () => {
  test('the unchanged draft is not dirty', () => {
    assert.equal(isDirty(stored, startingDraft(defaultRules, content), defaultRules), false);
  });
});

describe('recipe-form › Reset restores the starting values', () => {
  const edited = { ...stored, title: 'Stamppot', intro: 'x' };
  const reset = startingDraft(defaultRules, content);

  test('the edited draft is dirty', () => {
    assert.equal(isDirty(stored, edited, defaultRules), true);
  });

  test('the starting values are the stored ones', () => {
    assert.deepEqual(reset, stored);
  });

  test('the reset draft is not dirty', () => {
    assert.equal(isDirty(stored, reset, defaultRules), false);
  });
});

describe('recipe-form › Unsaved indicator', () => {
  test('a changed field is unsaved', () => {
    assert.equal(isDirty(stored, { ...stored, time: '1 uur' }, defaultRules), true);
  });

  test('an emptied field that was empty is not unsaved', () => {
    assert.equal(isDirty(stored, { ...stored, time: '' }, defaultRules), false);
  });
});

// Needs a browser: the inline question and its focus.
test.todo('recipe-form › Reset asks first');
// Needs a browser: answering "Nee" and pressing Esc.
test.todo('recipe-form › Reset can be declined');

// The confirmation itself (following a link) needs a browser; whether it is asked is decided by asksBeforeLeaving.
describe('recipe-form › Leaving when the draft could not be kept asks first', () => {
  const full = (state: typeof stored) =>
    saveDraft(fakeFullStorage, key, { state, initial: stored, base: {}, uploading: false, settledImage: '', now: new Date(), rules: defaultRules });
  const edited = { ...stored, title: 'Stamppot' };

  test('a full storage asks', () => {
    assert.equal(
      asksBeforeLeaving({ dirty: true, submitting: false }, () => full(edited).ok),
      true,
    );
  });

  test('a draft that is not kept asks', () => {
    assert.equal(
      asksBeforeLeaving({ dirty: true, submitting: false }, () => false),
      true,
    );
  });
});

describe('recipe-form › Leaving with a kept draft does not ask', () => {
  const setup = () => {
    const calls = { storedValue: '' };
    const storage = { ...fakeFullStorage, setItem: (_: string, v: string) => void (calls.storedValue = v) };
    const edited = { ...stored, title: 'Stamppot' };
    const keep = () =>
      saveDraft(storage, key, { state: edited, initial: stored, base: {}, uploading: false, settledImage: '', now: new Date(), rules: defaultRules })
        .ok;
    return { calls, keep };
  };

  test('nothing is asked', () => {
    assert.equal(asksBeforeLeaving({ dirty: true, submitting: false }, setup().keep), false);
  });

  test('the changes are on the device when the page is left', () => {
    const { calls, keep } = setup();
    asksBeforeLeaving({ dirty: true, submitting: false }, keep);
    assert.ok(calls.storedValue);
  });
});

describe('recipe-form › Leaving without changes does not ask', () => {
  const never = () => assert.fail('nothing to keep');

  test('a clean form does not ask', () => {
    assert.equal(asksBeforeLeaving({ dirty: false, submitting: false }, never), false);
  });

  // Saving: the form is submitted, so nothing is asked even though the editor still differs from the stored recipe.
  test('a submitting form does not ask', () => {
    assert.equal(asksBeforeLeaving({ dirty: true, submitting: true }, never), false);
  });
});
