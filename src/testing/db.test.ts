import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { createTestDb } from './db';

describe('createTestDb', () => {
  test('creates a database with the migrations applied', async () => {
    const { dispose } = await createTestDb();
    await dispose();
  });

  test('offers an in-memory photo bucket', async () => {
    const { photos, dispose } = await createTestDb();
    await photos.put('a', 'x');
    assert.equal(await (await photos.get('a'))?.text(), 'x');
    await dispose();
  });
});
