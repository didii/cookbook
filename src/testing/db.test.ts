import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { clearDb, clearPhotos } from './db';
import { test } from './test';

describe('test fixtures', () => {
  test('db has the migrations applied', async ({ db }) => {
    const table = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'recipes'").first();
    assert.notEqual(table, null);
  });

  test('photos is an in-memory bucket', async ({ photos }) => {
    await photos.put('a', 'x');
    assert.equal(await (await photos.get('a'))?.text(), 'x');
  });
});

describe('clearDb', () => {
  test('empties the tables', async ({ db }) => {
    await db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('s', 't', 'a')").run();
    await clearDb(db);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n, 0);
  });
});

describe('clearPhotos', () => {
  test('empties the bucket', async ({ photos }) => {
    await photos.put('a', 'x');
    await clearPhotos(photos);
    assert.equal((await photos.list()).objects.length, 0);
  });
});
