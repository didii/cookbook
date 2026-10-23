import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultRules } from '~app/shared/rules';
import { fake } from '~testing/fake';
import { addStep, editStep, emptyDraftSeed, startingDraft, typeIngredient } from './draft';
import { clearDraft, describeSavedAt, draftKey, isFresh, loadDraft, purgeDrafts, resolveStart, saveDraft, type DraftStorage } from './draftStore';

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

const initial = startingDraft(defaultRules, { ...emptyDraftSeed, title: 'Soep', author: 'Oma' });
const edited = { ...initial, title: 'Stamppot' };
const now = new Date('2026-10-19T12:00:00Z');
const keeping = (state = edited, extra: object = {}) => ({
  state,
  initial,
  base: { updatedAt: 'v1' },
  uploading: false,
  settledImage: '',
  now,
  rules: defaultRules,
  ...extra,
});
const key = draftKey('Oma@Example.com', 'soep');
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 3600 * 1000);

describe('recipe-draft › Edits are kept as they are made', () => {
  const withChips = editStep(addStep(typeIngredient(edited, 'i0', '2 el suiker', defaultRules), 0), 's1', 'Bak 20 minuten');
  const kept = () => {
    const { storage } = fakeStorage();
    const result = saveDraft(storage, key, keeping(withChips));
    return { result, draft: loadDraft(storage, key) };
  };

  test('saving succeeds', () => {
    assert.deepEqual(kept().result, { ok: true });
  });

  test('the state comes back as it was', () => {
    assert.deepEqual(kept().draft?.state, withChips);
  });

  test('the time of keeping is stored', () => {
    assert.equal(kept().draft?.savedAt, now.toISOString());
  });

  test('the base version is stored', () => {
    assert.deepEqual(kept().draft?.base, { updatedAt: 'v1' });
  });
});

describe('recipe-draft › An unchanged recipe keeps no draft', () => {
  test('saving the unchanged recipe succeeds', () => {
    const { storage } = fakeStorage();
    assert.deepEqual(saveDraft(storage, key, keeping(startingDraft(defaultRules, { ...emptyDraftSeed, title: ' Soep ', author: 'Oma' }))), {
      ok: true,
    });
  });

  test('saving the unchanged recipe removes an earlier draft', () => {
    const { storage } = fakeStorage();
    saveDraft(storage, key, keeping());
    assert.ok(loadDraft(storage, key));
    saveDraft(storage, key, keeping(startingDraft(defaultRules, { ...emptyDraftSeed, title: ' Soep ', author: 'Oma' })));
    assert.equal(loadDraft(storage, key), undefined);
  });
});

describe('recipe-draft › Drafts are per family member', () => {
  const setup = () => {
    const { storage } = fakeStorage();
    saveDraft(storage, draftKey('oma@example.com', 'soep'), keeping());
    return storage;
  };

  test('the same person finds it, in any case', () => {
    assert.ok(loadDraft(setup(), draftKey('OMA@example.com ', 'soep')));
  });

  test('another person does not', () => {
    assert.equal(loadDraft(setup(), draftKey('opa@example.com', 'soep')), undefined);
  });

  test('a recipe called "new" is not a new recipe', () => {
    assert.notEqual(draftKey('oma@example.com'), draftKey('oma@example.com', 'new'));
  });
});

describe('recipe-draft › A photo that is still uploading is not kept', () => {
  test('the settled image is kept instead of the upload', () => {
    const { storage } = fakeStorage();
    saveDraft(storage, key, keeping({ ...edited, image: 'blob:half' }, { uploading: true, settledImage: '/old.jpg' }));
    assert.equal(loadDraft(storage, key)?.state.image, '/old.jpg');
  });

  test('a finished upload is kept', () => {
    const { storage } = fakeStorage();
    saveDraft(storage, key, keeping({ ...edited, image: '/new.jpg' }, { settledImage: '/old.jpg' }));
    assert.equal(loadDraft(storage, key)?.state.image, '/new.jpg');
  });
});

describe('recipe-draft › Old drafts are cleaned up', () => {
  const purged = () => {
    const { storage, items } = fakeStorage();
    const put = (name: string, at: Date) => saveDraft(storage, draftKey('a@b.c', name), keeping(edited, { now: at }));
    put('old', daysAgo(31));
    put('fresh', daysAgo(29));
    for (let i = 0; i < 21; i++) put(`n${i}`, new Date(now.getTime() - i * 1000));
    items.set('other:key', 'x');
    purgeDrafts(storage, now);
    return { storage, items, left: [...items.keys()].filter((k) => k.startsWith('cookbook:draft:')) };
  };

  test('a draft older than 30 days goes', () => {
    const { storage } = purged();
    assert.equal(loadDraft(storage, draftKey('a@b.c', 'old')), undefined);
  });

  test('only drafts are touched', () => {
    assert.equal(purged().items.has('other:key'), true);
  });

  test('at most 20 drafts stay', () => {
    assert.equal(purged().left.length, 20);
  });

  test('the most recent stay', () => {
    assert.ok(purged().left.includes(draftKey('a@b.c', 'n0')));
  });

  test('the oldest beyond 20 go', () => {
    assert.ok(!purged().left.includes(draftKey('a@b.c', 'fresh')));
  });
});

describe('recipe-draft › An unreadable draft is ignored', () => {
  const unreadable = ['{not json', 'null', JSON.stringify({ v: 0, savedAt: now.toISOString(), base: {}, state: edited }), JSON.stringify({ v: 1 })];
  for (const bad of unreadable) {
    test(`${bad} is not loaded`, () => {
      const { storage, items } = fakeStorage();
      items.set(key, bad);
      assert.equal(loadDraft(storage, key), undefined);
    });

    test(`${bad} is removed`, () => {
      const { storage, items } = fakeStorage();
      items.set(key, bad);
      loadDraft(storage, key);
      assert.equal(items.has(key), false);
    });
  }

  test('a draft with wrong chips is not loaded', () => {
    const { storage, items } = fakeStorage();
    saveDraft(storage, key, keeping());
    items.set(key, items.get(key)!.replace('"chips":[]', '"chips":7'));
    assert.equal(loadDraft(storage, key), undefined);
  });

  test('purging removes unreadable ones too', () => {
    const { storage, items } = fakeStorage();
    items.set(key, '{}');
    purgeDrafts(storage, now);
    assert.equal(items.size, 0);
  });
});

describe('recipe-draft › Storage that fails does not break editing', () => {
  test('a full storage reports the draft as not kept', () => {
    const full = fakeStorage({ write: true });
    assert.deepEqual(saveDraft(full.storage, key, keeping()), { ok: false });
  });

  test('a blocked storage loads nothing', () => {
    const blocked = fakeStorage({ read: true, write: true });
    assert.equal(loadDraft(blocked.storage, key), undefined);
  });

  test('a blocked storage can be purged', () => {
    const blocked = fakeStorage({ read: true, write: true });
    assert.doesNotThrow(() => purgeDrafts(blocked.storage, now));
  });

  test('a blocked storage can be cleared', () => {
    const blocked = fakeStorage({ read: true, write: true });
    assert.equal(clearDraft(blocked.storage, key), true);
  });

  test('no storage reports the draft as not kept', () => {
    assert.deepEqual(saveDraft(undefined, key, keeping()), { ok: false });
  });

  test('no storage loads nothing', () => {
    assert.equal(loadDraft(undefined, key), undefined);
  });

  test('no storage can be purged', () => {
    assert.doesNotThrow(() => purgeDrafts(undefined, now));
  });
});

// Start-up: what the editor shows, from the draft, the edit link and the stored recipe's version.
const draftOf = (state = edited, base: { updatedAt?: string } = { updatedAt: 'v1' }) => {
  const { storage } = fakeStorage();
  saveDraft(storage, key, { ...keeping(state), base });
  return { storage, draft: loadDraft(storage, key) };
};
const start = (o: { draft?: ReturnType<typeof loadDraft>; fresh?: boolean; updatedAt?: string }) =>
  resolveStart({ draft: o.draft, fresh: o.fresh ?? false, shown: initial, updatedAt: o.updatedAt });

describe('recipe-draft › A reload restores the draft', () => {
  const s = start({ draft: draftOf().draft, updatedAt: 'v1' });

  test('the draft is shown', () => {
    assert.deepEqual(s.state, edited);
  });

  test('the time it was kept is reported', () => {
    assert.equal(s.restoredAt, now.toISOString());
  });

  test('the recipe is not flagged as changed', () => {
    assert.equal(s.changedMeanwhile, false);
  });

  test('the draft is not discarded', () => {
    assert.equal(s.discard, false);
  });
});

describe('recipe-draft › An unfinished new recipe returns', () => {
  const s = start({ draft: draftOf(edited, {}).draft });

  test('the draft is shown', () => {
    assert.deepEqual(s.state, edited);
  });

  test('a new recipe has no version to differ from', () => {
    assert.equal(s.changedMeanwhile, false);
  });

  test('without a draft nothing is restored', () => {
    assert.equal(start({}).restoredAt, undefined);
  });
});

describe('recipe-draft › The edit link starts fresh', () => {
  const { storage, draft } = draftOf();
  const s = start({ draft, fresh: isFresh({ fresh: true }), updatedAt: 'v1' });

  test('the stored recipe is shown', () => {
    assert.deepEqual(s.state, initial);
  });

  test('nothing is restored', () => {
    assert.equal(s.restoredAt, undefined);
  });

  test('the draft is discarded', () => {
    assert.equal(s.discard, true);
  });

  test('clearing removes the draft', () => {
    clearDraft(storage, key);
    assert.equal(loadDraft(storage, key), undefined);
  });
});

describe('recipe-draft › A reload after the edit link keeps the new draft', () => {
  // The flag is consumed by replacing the history state, so the reload carries none.
  test('the fresh flag is read from the history state', () => {
    assert.equal(isFresh({ fresh: true }), true);
  });

  for (const reload of [null, undefined, {}, 'fresh']) {
    test(`${JSON.stringify(reload) ?? 'undefined'} is not fresh`, () => {
      assert.equal(isFresh(reload), false);
    });
  }

  test('the draft is shown after a reload', () => {
    const { draft } = draftOf();
    assert.deepEqual(start({ draft, fresh: isFresh(null), updatedAt: 'v1' }).state, edited);
  });
});

describe('recipe-draft › A recipe changed meanwhile is flagged', () => {
  const s = start({ draft: draftOf().draft, updatedAt: 'v2' });

  test('the change is flagged', () => {
    assert.equal(s.changedMeanwhile, true);
  });

  test('nothing is replaced without a choice', () => {
    assert.deepEqual(s.state, edited);
  });
});

describe('recipe-draft › Keeping the draft after a change', () => {
  const again = () => {
    const { storage, draft } = draftOf();
    const asked = start({ draft, updatedAt: 'v2' });
    // Keeping moves the base to the current version; the next write carries it and the question does not return.
    saveDraft(storage, key, { ...keeping(asked.state), base: { updatedAt: 'v2' } });
    return start({ draft: loadDraft(storage, key), updatedAt: 'v2' });
  };

  test('the question does not return', () => {
    assert.equal(again().changedMeanwhile, false);
  });

  test('the draft is still shown', () => {
    assert.deepEqual(again().state, edited);
  });
});

describe('recipe-draft › Starting over after a change', () => {
  const s = (() => {
    const { storage } = draftOf();
    clearDraft(storage, key);
    return start({ draft: loadDraft(storage, key), updatedAt: 'v2' });
  })();

  test('the stored recipe is shown', () => {
    assert.deepEqual(s.state, initial);
  });

  test('the recipe is not flagged as changed', () => {
    assert.equal(s.changedMeanwhile, false);
  });
});

describe('a restored draft whose anchors no longer fit', () => {
  const step = (over: object) => ({ id: 's0', body: 'Bak 20 minuten', chips: [], ghosts: [], ...over });
  const chip = (over: object) => ({ id: 'c0', kind: 'timer', mode: 'auto', anchor: { start: 4, end: 14 }, values: { minutes: 20 }, ...over });
  const state = {
    ...edited,
    ingredients: [{ id: 'i0', text: '2 el suiker' }],
    steps: [
      step({
        chips: [
          chip({}),
          chip({ id: 'c1', anchor: { start: 4, end: 99 } }),
          chip({ id: 'c2', kind: 'ingredient', mode: 'manual', rowId: 'i9', anchor: { start: 0, end: 3 }, values: { quantity: '', name: 'x' } }),
          chip({ id: 'c3', kind: 'ingredient', rowId: 'i0', values: { quantity: '', name: 'suiker' } }),
        ],
        ghosts: [
          { id: 'c4', kind: 'oven', anchor: { start: 0, end: 3 } },
          { id: 'c5', kind: 'oven', anchor: { start: 10, end: 30 } },
          { id: 'c6', kind: 'ingredient', rowId: 'i9', anchor: { start: 0, end: 3 } },
        ],
      }),
    ],
  };
  const { draft } = draftOf(fake<typeof edited>(state));
  const [fitted] = start({ draft, updatedAt: 'v1' }).state.steps;
  const byId = Object.fromEntries(fitted.chips.map((c) => [c.id, c]));

  test('a fitting chip is untouched', () => {
    assert.deepEqual(byId.c0, state.steps[0].chips[0]);
  });

  test('a chip whose anchor is too long becomes manual without an anchor', () => {
    assert.deepEqual([byId.c1.mode, byId.c1.anchor], ['manual', undefined]);
  });

  test('a chip linked to a missing row loses the row and keeps its anchor', () => {
    assert.deepEqual([byId.c2.mode, byId.c2.rowId, byId.c2.anchor], ['manual', undefined, { start: 0, end: 3 }]);
  });

  test('a chip linked to an existing row is untouched', () => {
    assert.deepEqual(byId.c3, state.steps[0].chips[3]);
  });

  test('only the fitting ghost stays', () => {
    assert.deepEqual(
      fitted.ghosts.map((g) => g.id),
      ['c4'],
    );
  });
});

describe('describeSavedAt', () => {
  const at = (d: Date) => d.toISOString();
  const noon = new Date(2026, 9, 19, 12, 0);

  test('today shows the time', () => {
    assert.equal(describeSavedAt(at(new Date(2026, 9, 19, 14, 32)), noon), 'vandaag 14:32');
  });

  test('yesterday shows the time', () => {
    assert.equal(describeSavedAt(at(new Date(2026, 9, 18, 9, 10)), noon), 'gisteren 09:10');
  });

  test('earlier shows the date', () => {
    assert.equal(describeSavedAt(at(new Date(2026, 9, 12, 9, 10)), noon), '12 oktober');
  });
});
