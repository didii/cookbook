import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { defined } from '~testing/defined';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { createRecipe, listRecipes } from '~/.server/recipes';
import { createUser } from '~/.server/users';
import type { Route } from './+types/route';
import { loader } from './route';

// Real loader against an in-memory D1 holding a recipe the test inserted.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const load = (slug: string, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db } as Partial<Env> as Env);
  context.set(userEmailContext, email);
  return loader({ params: { slug }, context } as Partial<Route.LoaderArgs> as Route.LoaderArgs);
};

test('recipe-viewing › Unknown slug', async () => {
  await assert.rejects(load('does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
});

const viewCount = async (slug: string) =>
  (await db
    .prepare('SELECT COUNT(*) AS n FROM recipe_views v JOIN recipes r ON r.id = v.recipe_id WHERE r.slug = ?')
    .bind(slug)
    .first<{ n: number }>())!.n;

test('recipe-new-marker › Opening the recipe', async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  const slug = await createRecipe(db, { title: 'Net geopend', author: 'Papa', createdBy: 'papa@example.com' });
  const isNew = async () => (await listRecipes(db, 'oma@example.com', new Date())).find((r) => r.slug === slug)?.isNew;
  assert.equal(await isNew(), true);
  await load(slug);
  assert.equal(await isNew(), false);
});

test('recipe-new-marker › Opening twice', async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  const slug = await createRecipe(db, { title: 'Twee keer', author: 'Oma' });
  await load(slug);
  await load(slug);
  assert.equal(await viewCount(slug), 1);
});

test('opening a recipe records nothing for an unknown recipe', async () => {
  await assert.rejects(load('does-not-exist'));
  assert.equal(
    (await db.prepare('SELECT COUNT(*) AS n FROM recipe_views WHERE recipe_id NOT IN (SELECT id FROM recipes)').first<{ n: number }>())!.n,
    0,
  );
});

test('the page gets the steps of the database with their chips', async () => {
  const steps = [
    { body: 'Bak 30 minuten op 180 graden.', ingredients: [{ quantityText: '', name: 'boter' }], ovenTemperature: 180, timer: { minutes: 30 } },
  ];
  const slug = await createRecipe(db, { title: 'Uit de database', author: 'Oma', steps });
  const { recipe, steps: loaded } = await load(slug);
  assert.equal(recipe.title, 'Uit de database');
  assert.deepEqual(defined(loaded), steps);
});
