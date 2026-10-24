import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe } from 'vitest';
import { applySql } from '~testing/db';
import { test } from '~testing/test';

describe('dev seed', () => {
  test('runs against the migrated schema', async ({ db }) => {
    await applySql(db, join(import.meta.dirname, 'dev.sql'));
    assert.ok(((await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n ?? 0) > 0);
  });

  test('some recipe has categories', async ({ db }) => {
    await applySql(db, join(import.meta.dirname, 'dev.sql'));
    assert.ok(((await db.prepare('SELECT COUNT(*) AS n FROM recipe_categories').first<{ n: number }>())?.n ?? 0) > 0);
  });
});
