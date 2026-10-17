import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~/lib/context';
import type { Route } from './+types/route';
import { loader } from './route';

// Loader-level tests: real loader, real queries, recipes inserted by the test. Row mapping is unit-tested in recipes.test.ts.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
  await db.batch([
    db.prepare("INSERT INTO recipes (slug, title, author, time, servings, intro) VALUES ('appeltaart', 'Appeltaart', 'Oma', '1u', 8, 'Zoet')"),
    // Entered out of position order, so the test proves the loader returns them sorted.
    db.prepare(
      "INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 2, 'suiker', '100 g')",
    ),
    db.prepare(
      "INSERT INTO ingredients (recipe_id, position, name, quantity_text) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 1, 'appels', '4')",
    ),
    db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 2, 'bakken')"),
    db.prepare("INSERT INTO steps (recipe_id, position, body) VALUES ((SELECT id FROM recipes WHERE slug = 'appeltaart'), 1, 'snijden')"),
  ]);
});

after(() => dispose());

const load = (slug: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db } as Partial<Env> as Env);
  return loader({ params: { slug }, context } as Partial<Route.LoaderArgs> as Route.LoaderArgs);
};

test('recipe-viewing › Existing recipe', async () => {
  const { recipe } = await load('appeltaart');
  assert.deepEqual([recipe.title, recipe.author, recipe.time, recipe.servings, recipe.intro], ['Appeltaart', 'Oma', '1u', 8, 'Zoet']);
});

test('recipe-viewing › Order is kept', async () => {
  const { recipe } = await load('appeltaart');
  assert.deepEqual(
    recipe.ingredients.map((i) => i.name),
    ['appels', 'suiker'],
  );
  assert.deepEqual(recipe.steps, ['snijden', 'bakken']);
});

test('recipe-viewing › Unknown slug', async () => {
  await assert.rejects(load('does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
});

// Not automated: rendering needs component tests.
test.todo('recipe-viewing › Optional fields are empty');
test.todo('recipe-viewing › Ingredient without quantity');
