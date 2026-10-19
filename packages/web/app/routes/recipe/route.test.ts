import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { defined } from '~testing/defined';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~/.server/context';
import { createRecipe } from '~/.server/recipes';
import type { Route } from './+types/route';
import { loader } from './route';

// Real loader against an in-memory D1 holding a recipe the test inserted.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const load = (slug: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db } as Partial<Env> as Env);
  return loader({ params: { slug }, context } as Partial<Route.LoaderArgs> as Route.LoaderArgs);
};

test('recipe-viewing › Unknown slug', async () => {
  await assert.rejects(load('does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
});

test('the page gets the steps of the database with their chips', async () => {
  const steps = [
    { body: 'Bak 30 minuten op 180 graden.', ingredients: [{ quantity_text: '', name: 'boter' }], ovenTemperature: 180, timer: { minutes: 30 } },
  ];
  const slug = await createRecipe(db, { title: 'Uit de database', author: 'Oma', steps });
  const { recipe, steps: loaded } = await load(slug);
  assert.equal(recipe.title, 'Uit de database');
  assert.deepEqual(defined(loaded), steps);
});

// Not automated: rendering needs component tests.
test.todo('recipe-viewing › Optional fields are empty');
test.todo('recipe-viewing › Ingredient without quantity');

// Rendering needs the JSX settings that tsx doesn't read from this project's tsconfig, so this checks the source:
// the page links to the edit address of its own recipe and the route table serves it.
test('recipe-viewing › Link to the edit form', () => {
  assert.ok(readFileSync(new URL('./RecipePage.tsx', import.meta.url), 'utf8').includes('/bewerken`}'));
  assert.ok(readFileSync(new URL('../../routes.ts', import.meta.url), 'utf8').includes("'recepten/:slug/bewerken'"));
});
