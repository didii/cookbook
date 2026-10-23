import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyDraftSeed, startingDraft } from '~app/routes/edit-recipe/lib/draft';
import { draftKey, draftKeyField, loadDraft, saveDraft, type DraftStorage } from '~app/routes/edit-recipe/lib/draftStore';
import { defaultRules } from '~app/shared/rules';
import { endDraftAfterSave } from './endDraftAfterSave';

const items = new Map<string, string>();
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
test('recipe-draft › A save ends the draft', async () => {
  keep();
  await assert.rejects(
    save(() => Promise.reject(new Response(null, { status: 302, headers: { Location: '/recepten/soep' } }))),
    (e) => e instanceof Response && e.status === 302,
  );
  assert.equal(loadDraft(storage, key), undefined);
});

test('recipe-draft › A refused save keeps the draft', async () => {
  keep();
  const refused = { errors: { title: 'Vul een titel in' } };
  assert.equal(await save(() => Promise.resolve(refused)), refused);
  assert.ok(loadDraft(storage, key));
  // Nor does a failure that is not a redirect end it.
  await assert.rejects(save(() => Promise.reject(new Error('offline'))));
  await assert.rejects(save(() => Promise.reject(new Response('nope', { status: 500 }))));
  assert.ok(loadDraft(storage, key));
});

test('recipe-draft › Reset ends the draft', () => {
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
