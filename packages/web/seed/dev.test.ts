import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestDb } from '../testing/db';

test('the dev seed loads every sample recipe with its ingredients and steps', async () => {
  const { db, dispose } = await createTestDb({ seed: true });
  try {
    const n = async (table: string) => (await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>())!.n;
    assert.deepEqual([await n('recipes'), await n('ingredients'), await n('steps')], [6, 34, 23]);
    assert.equal((await db.prepare("SELECT title FROM recipes WHERE slug = 'appeltaart'").first<{ title: string }>())?.title, 'Appeltaart');
  } finally {
    await dispose();
  }
});
