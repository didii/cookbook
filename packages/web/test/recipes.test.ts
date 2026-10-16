import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRecipe } from '../app/lib/recipes.ts';

const row = { id: 7, slug: 'x', title: 'X', author: 'Oma', time: null, servings: 4, intro: '', image: null, seal: null };

/** Fake D1: statements remember their SQL, batch answers per statement. */
const fakeDb = (recipe: object | null) =>
  ({
    prepare: (sql: string) => ({
      sql,
      bind() {
        return this;
      },
      first: async () => recipe,
    }),
    batch: async (stmts: { sql: string }[]) =>
      stmts.map((s) => ({
        results: s.sql.includes('FROM ingredients')
          ? [
              { q: '1', item: 'ei' },
              { q: '', item: 'zout' },
            ]
          : [{ body: 'een' }, { body: 'twee' }],
      })),
  }) as unknown as D1Database;

test('returns undefined for an unknown slug', async () => {
  assert.equal(await getRecipe(fakeDb(null), 'nope'), undefined);
});

test('maps columns and keeps list order', async () => {
  const r = await getRecipe(fakeDb(row), 'x');
  assert.equal(r?.by, 'Oma');
  assert.equal(r?.time, null);
  assert.deepEqual(r?.ingredients, [
    { q: '1', item: 'ei' },
    { q: '', item: 'zout' },
  ]);
  assert.deepEqual(r?.steps, ['een', 'twee']);
});

test('queries order by position', async () => {
  const sqls: string[] = [];
  const db = fakeDb(row) as unknown as { batch: (s: { sql: string }[]) => Promise<unknown> };
  const orig = db.batch;
  db.batch = (s) => (sqls.push(...s.map((x) => x.sql)), orig(s));
  await getRecipe(db as unknown as D1Database, 'x');
  assert.equal(sqls.length, 2);
  assert.ok(sqls.every((q) => q.includes('ORDER BY position')));
});
