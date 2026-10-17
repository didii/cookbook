import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestDb } from './db.ts';

test('applies the migrations to an in-memory D1', async () => {
  const { db, dispose } = await createTestDb();
  try {
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all<{ name: string }>();
    const tables = results.map((r) => r.name).filter((n) => !n.startsWith('sqlite_') && !n.startsWith('_cf_'));
    assert.deepEqual(tables, ['ingredients', 'recipes', 'step_ingredients', 'steps']);
  } finally {
    await dispose();
  }
});
