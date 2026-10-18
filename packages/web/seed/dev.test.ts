import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { applySql, createTestDb } from '~testing/db';
import { appeltaartSteps } from '~testing/steps';
import { findRecipe } from '~/lib/recipes';

test('the dev seed runs against the migrated schema', async () => {
  const { db, dispose } = await createTestDb();
  try {
    await applySql(db, join(import.meta.dirname, 'dev.sql'));
  } finally {
    await dispose();
  }
});

test('the Appeltaart is the same in the seed, the sample data and the design fixture', async () => {
  const { db, dispose } = await createTestDb();
  try {
    await applySql(db, join(import.meta.dirname, 'dev.sql'));
    const slug = 'appeltaart';
    const steps = await db
      .prepare('SELECT s.body FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position')
      .bind(slug)
      .all<{ body: string }>();
    const ingredients = await db
      .prepare(
        'SELECT i.quantity_text AS q, i.name AS item FROM ingredients i JOIN recipes r ON r.id = i.recipe_id WHERE r.slug = ? ORDER BY i.position',
      )
      .bind(slug)
      .all();
    const sample = findRecipe(slug)!;
    const bodies = appeltaartSteps.map((s) => s.body);
    assert.deepEqual(
      steps.results.map((s) => s.body),
      bodies,
    );
    assert.deepEqual(sample.steps, bodies);
    assert.deepEqual(ingredients.results, sample.ingredients);
  } finally {
    await dispose();
  }
});
