import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { defaultRules } from '~app/shared/rules';
import { emptyDraftSeed, startingDraft } from './draft';
import { draftKey, draftKeyField, loadDraft, saveDraft, type DraftStorage } from './draftStore';
import { endDraftAfterSave } from './endDraftAfterSave';

const items = new Map<string, string>();
beforeEach(() => items.clear());
const storage: DraftStorage = {
  get length() {
    return items.size;
  },
  key: (i) => [...items.keys()][i] ?? null,
  getItem: (k) => items.get(k) ?? null,
  setItem: (k, v) => void items.set(k, v),
  removeItem: (k) => void items.delete(k),
};
const key = draftKey('oma@example.com', 'soep');
const initial = startingDraft(defaultRules, { ...emptyDraftSeed, title: 'Soep' });
const keep = () =>
  saveDraft(storage, key, {
    state: { ...initial, title: 'Stamppot' },
    initial,
    base: {},
    uploading: false,
    settledImage: '',
    now: new Date(),
    rules: defaultRules,
  });
const save = (serverAction: () => Promise<unknown>) =>
  endDraftAfterSave(
    { request: new Request('http://x/', { method: 'POST', body: new URLSearchParams({ [draftKeyField]: key }) }), serverAction },
    storage,
  );

// The server action as the browser sees it (react-router's single fetch): a success is a thrown redirect, a refusal is returned data.
describe('recipe-draft › A save ends the draft', () => {
  test('the redirect is passed on', async () => {
    keep();
    await assert.rejects(
      save(() => Promise.reject(new Response(null, { status: 302, headers: { Location: '/recepten/soep' } }))),
      (e) => e instanceof Response && e.status === 302,
    );
  });

  test('the draft is removed', async () => {
    keep();
    await save(() => Promise.reject(new Response(null, { status: 302, headers: { Location: '/recepten/soep' } }))).catch(() => undefined);
    assert.equal(loadDraft(storage, key), undefined);
  });
});

describe('recipe-draft › A refused save keeps the draft', () => {
  test('refused data is returned and the draft stays', async () => {
    keep();
    const refused = { errors: { title: 'Vul een titel in' } };
    assert.equal(await save(() => Promise.resolve(refused)), refused);
    assert.ok(loadDraft(storage, key));
  });

  test('a failure that is not a redirect does not end it', async () => {
    keep();
    await assert.rejects(save(() => Promise.reject(new Error('offline'))));
    assert.ok(loadDraft(storage, key));
  });

  test('a failed response does not end it', async () => {
    keep();
    await assert.rejects(save(() => Promise.reject(new Response('nope', { status: 500 }))));
    assert.ok(loadDraft(storage, key));
  });
});

describe('recipe-draft › Reset ends the draft', () => {
  test('keeping the starting values removes the draft', () => {
    keep();
    // Herstel puts the starting values back: the editor equals the stored recipe, so keeping it removes the draft.
    saveDraft(storage, key, {
      state: startingDraft(defaultRules, { ...emptyDraftSeed, title: 'Soep' }),
      initial,
      base: {},
      uploading: false,
      settledImage: '',
      now: new Date(),
      rules: defaultRules,
    });
    assert.equal(loadDraft(storage, key), undefined);
  });
});
