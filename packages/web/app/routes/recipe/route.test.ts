import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTestDb } from '~testing/db';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~/lib/context';
import type { Route } from './+types/route';
import { loader } from './route';

// The single integration test for this endpoint: real loader, real queries, a recipe inserted by the test.
// Not-found handling and row mapping are unit-tested where that logic lives.
test('loads a stored recipe through the real loader', async () => {
  const { db, dispose } = await createTestDb();
  try {
    await db.batch([
      db.prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('appeltaart', 'Appeltaart', 'Oma', 8)"),
      db.prepare("INSERT INTO ingredients (recipe_id, position, name) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 1, 'appels')"),
      db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 1, 'bakken')"),
    ]);
    const context = new RouterContextProvider();
    context.set(envContext, { DB: db } as Partial<Env> as Env);
    const { recipe } = await loader({ params: { slug: 'appeltaart' }, context } as Partial<Route.LoaderArgs> as Route.LoaderArgs);
    assert.equal(recipe.title, 'Appeltaart');
    assert.deepEqual(recipe.ingredients, [{ quantity_text: '', name: 'appels' }]);
    assert.deepEqual(recipe.steps, ['bakken']);
  } finally {
    await dispose();
  }
});
