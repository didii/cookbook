import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe } from 'vitest';
import { numberValue } from '~app/shared/numbers';
import { applySql } from '~testing/db';
import { test } from '~testing/test';

describe('dev seed', () => {
  test('runs against the migrated schema', async ({ db }) => {
    await applySql(db, join(import.meta.dirname, 'dev.sql'));
    assert.ok(((await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n ?? 0) > 0);
  });

  test('some recipe has tags', async ({ db }) => {
    await applySql(db, join(import.meta.dirname, 'dev.sql'));
    assert.ok(((await db.prepare('SELECT COUNT(*) AS n FROM recipe_tags').first<{ n: number }>())?.n ?? 0) > 0);
  });

  test('each step amount sits on a number equal to its value', async ({ db }) => {
    await applySql(db, join(import.meta.dirname, 'dev.sql'));
    const { results } = await db
      .prepare(
        'SELECT substr(s.body, q.start_index + 1, q.end_index - q.start_index) AS text, q.quantity_value AS value FROM step_quantities q JOIN steps s ON s.id = q.step_id',
      )
      .all<{ text: string; value: number }>();
    assert.ok(results.length > 0);
    for (const { text, value } of results) assert.equal(numberValue(text), value);
  });
});
