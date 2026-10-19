import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addStep, editStep, emptyContent, startingDraft, typeIngredient } from './draft';
import { clearDraft, draftKey, loadDraft, purgeDrafts, saveDraft, type DraftStorage } from './draftStore';

/** An in-memory storage that can be told to throw on reads or writes. */
function fakeStorage(fail: { read?: boolean; write?: boolean } = {}) {
  const items = new Map<string, string>();
  const storage: DraftStorage = {
    get length() {
      return items.size;
    },
    key: (i) => [...items.keys()][i] ?? null,
    getItem: (k) => {
      if (fail.read) throw new Error('blocked');
      return items.get(k) ?? null;
    },
    setItem: (k, v) => {
      if (fail.write) throw new Error('full');
      items.set(k, v);
    },
    removeItem: (k) => void items.delete(k),
  };
  return { storage, items };
}

const initial = startingDraft({ ...emptyContent, title: 'Soep', author: 'Oma' });
const edited = { ...initial, title: 'Stamppot' };
const now = new Date('2026-10-19T12:00:00Z');
const keeping = (state = edited, extra: object = {}) => ({
  state,
  initial,
  base: { updatedAt: 'v1' },
  uploading: false,
  settledImage: '',
  now,
  ...extra,
});
const key = draftKey('Oma@Example.com', 'soep');
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 3600 * 1000);

test('recipe-draft › Edits are kept as they are made', () => {
  const { storage } = fakeStorage();
  const withChips = editStep(addStep(typeIngredient(edited, 'i0', '2 el suiker'), 0), 's1', 'Bak 20 minuten');
  assert.deepEqual(saveDraft(storage, key, keeping(withChips)), { ok: true });
  const draft = loadDraft(storage, key);
  assert.deepEqual(draft?.state, withChips);
  assert.equal(draft?.savedAt, now.toISOString());
  assert.deepEqual(draft?.base, { updatedAt: 'v1' });
});

test('recipe-draft › An unchanged recipe keeps no draft', () => {
  const { storage } = fakeStorage();
  saveDraft(storage, key, keeping());
  assert.ok(loadDraft(storage, key));
  assert.deepEqual(saveDraft(storage, key, keeping(startingDraft({ ...emptyContent, title: ' Soep ', author: 'Oma' }))), { ok: true });
  assert.equal(loadDraft(storage, key), undefined);
});

test('recipe-draft › Drafts are per family member', () => {
  const { storage } = fakeStorage();
  saveDraft(storage, draftKey('oma@example.com', 'soep'), keeping());
  assert.ok(loadDraft(storage, draftKey('OMA@example.com ', 'soep')), 'same person, any case');
  assert.equal(loadDraft(storage, draftKey('opa@example.com', 'soep')), undefined);
  assert.notEqual(draftKey('oma@example.com'), draftKey('oma@example.com', 'new'), 'a recipe called "new" is not a new recipe');
});

test('recipe-draft › A photo that is still uploading is not kept', () => {
  const { storage } = fakeStorage();
  saveDraft(storage, key, keeping({ ...edited, image: 'blob:half' }, { uploading: true, settledImage: '/old.jpg' }));
  assert.equal(loadDraft(storage, key)?.state.image, '/old.jpg');
  saveDraft(storage, key, keeping({ ...edited, image: '/new.jpg' }, { settledImage: '/old.jpg' }));
  assert.equal(loadDraft(storage, key)?.state.image, '/new.jpg');
});

test('recipe-draft › Old drafts are cleaned up', () => {
  const { storage, items } = fakeStorage();
  const put = (name: string, at: Date) => saveDraft(storage, draftKey('a@b.c', name), keeping(edited, { now: at }));
  put('old', daysAgo(31));
  put('fresh', daysAgo(29));
  for (let i = 0; i < 21; i++) put(`n${i}`, new Date(now.getTime() - i * 1000));
  items.set('other:key', 'x');
  purgeDrafts(storage, now);
  assert.equal(loadDraft(storage, draftKey('a@b.c', 'old')), undefined);
  assert.equal(items.has('other:key'), true, 'only drafts are touched');
  const left = [...items.keys()].filter((k) => k.startsWith('cookbook:draft:'));
  assert.equal(left.length, 20);
  assert.ok(left.includes(draftKey('a@b.c', 'n0')), 'the most recent stay');
  assert.ok(!left.includes(draftKey('a@b.c', 'fresh')), 'the oldest beyond 20 go');
});

test('recipe-draft › An unreadable draft is ignored', () => {
  const { storage, items } = fakeStorage();
  for (const bad of ['{not json', 'null', JSON.stringify({ v: 0, savedAt: now.toISOString(), base: {}, state: edited }), JSON.stringify({ v: 1 })]) {
    items.set(key, bad);
    assert.equal(loadDraft(storage, key), undefined);
    assert.equal(items.has(key), false, 'and removed');
  }
  saveDraft(storage, key, keeping());
  items.set(key, items.get(key)!.replace('"chips":[]', '"chips":7'));
  assert.equal(loadDraft(storage, key), undefined);
  items.set(key, '{}');
  purgeDrafts(storage, now);
  assert.equal(items.size, 0, 'purging removes unreadable ones too');
});

test('recipe-draft › Storage that fails does not break editing', () => {
  const full = fakeStorage({ write: true });
  assert.deepEqual(saveDraft(full.storage, key, keeping()), { ok: false });
  const blocked = fakeStorage({ read: true, write: true });
  assert.equal(loadDraft(blocked.storage, key), undefined);
  assert.doesNotThrow(() => purgeDrafts(blocked.storage, now));
  assert.equal(clearDraft(blocked.storage, key), true);
  assert.deepEqual(saveDraft(undefined, key, keeping()), { ok: false });
  assert.equal(loadDraft(undefined, key), undefined);
  assert.doesNotThrow(() => purgeDrafts(undefined, now));
});
