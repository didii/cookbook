import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRecipe } from '../app/lib/recipes.ts';

const row = { id: 7, slug: 'x', title: 'X', author: 'Oma', time: null, servings: 4, intro: '', image: null, seal: null };

/** Fake D1: batch answers per statement and records every batch's SQL. */
const fakeDb = (recipe: object | null) => {
  const batches: string[][] = [];
  const db = {
    prepare: (sql: string) => ({
      sql,
      bind() {
        return this;
      },
    }),
    batch: async (stmts: { sql: string }[]) => {
      batches.push(stmts.map((s) => s.sql));
      return stmts.map((s) => ({
        results: s.sql.includes('FROM recipes WHERE')
          ? recipe
            ? [recipe]
            : []
          : s.sql.includes('FROM ingredients')
            ? [
                { quantity_text: '1', name: 'ei' },
                { quantity_text: '', name: 'zout' },
              ]
            : [{ body: 'een' }, { body: 'twee' }],
      }));
    },
  };
  return { db: db as unknown as D1Database, batches };
};

test('returns undefined for an unknown slug', async () => {
  assert.equal(await getRecipe(fakeDb(null).db, 'nope'), undefined);
});

test('keeps column names and list order', async () => {
  const r = await getRecipe(fakeDb(row).db, 'x');
  assert.equal(r?.author, 'Oma');
  assert.equal(r?.time, null);
  assert.deepEqual(r?.ingredients, [
    { quantity_text: '1', name: 'ei' },
    { quantity_text: '', name: 'zout' },
  ]);
  assert.deepEqual(r?.steps, ['een', 'twee']);
});

test('uses one batch and orders lists by position', async () => {
  const { db, batches } = fakeDb(row);
  await getRecipe(db, 'x');
  assert.equal(batches.length, 1);
  assert.ok(batches[0].slice(1).every((q) => q.includes('ORDER BY') && q.includes('position')));
});
