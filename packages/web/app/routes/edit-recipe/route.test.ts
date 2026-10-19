import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~/.server/context';
import { getRecipe } from '~/.server/recipes';
import type { Route } from './+types/route';
import { action, loader } from './route';

// Real loader and action against an in-memory D1 holding a recipe the test inserted.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
  await db
    .prepare("INSERT INTO recipes (slug, title, author, time, servings, intro, image) VALUES ('soep', 'Soep', 'Oma', '1u', 4, 'Warm', '/soep.jpg')")
    .run();
});

after(() => dispose());

const contextWithDb = () => {
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db } as Partial<Env> as Env);
  return context;
};

const load = (slug: string) => loader({ params: { slug }, context: contextWithDb() } as Partial<Route.LoaderArgs> as Route.LoaderArgs);

const submit = (slug: string, fields: Record<string, string>) =>
  action({
    params: { slug },
    request: new Request(`http://localhost/recepten/${slug}/bewerken`, { method: 'POST', body: new URLSearchParams(fields) }),
    context: contextWithDb(),
  } as Partial<Route.ActionArgs> as Route.ActionArgs);

const status = async (run: Promise<unknown>) => {
  try {
    await run;
  } catch (e) {
    return (e as { init?: { status?: number } }).init?.status;
  }
};

test('recipe-editing › Form shows the stored values', async () => {
  const { values } = await load('soep');
  assert.deepEqual(values, { title: 'Soep', author: 'Oma', servings: '4', time: '1u', intro: 'Warm', image: '/soep.jpg' });
});

test('recipe-editing › Unknown recipe', async () => {
  assert.equal(await status(load('nope')), 404);
  assert.equal(await status(submit('nope', { title: 'X', author: 'Y' })), 404);
});

test('recipe-editing › Invalid edit is refused', async () => {
  const res = (await submit('soep', { title: '', author: 'Oma' })) as { init?: { status?: number }; data: { errors: object } };
  assert.equal(res.init?.status, 400);
  assert.deepEqual(Object.keys(res.data.errors), ['title']);
  assert.equal((await getRecipe(db, 'soep'))?.title, 'Soep');
});

test('route saves the edit and goes back to the recipe', async () => {
  const res = (await submit('soep', { title: 'Tomatensoep', author: 'Oma', servings: '' })) as Response;
  assert.equal(res.headers.get('Location'), '/recepten/soep');
  const r = await getRecipe(db, 'soep');
  assert.deepEqual([r?.title, r?.servings], ['Tomatensoep', null]);
});

// Both routes must render the shared editor and write no fields of their own, so the UI can only differ in values, heading and cancel target.
test('recipe-editing › Same form for new and existing recipes', () => {
  for (const route of ['../edit-recipe/route.tsx', '../new-recipe/route.tsx']) {
    const source = readFileSync(new URL(route, import.meta.url), 'utf8');
    assert.match(source, /<RecipeEditor\b/, route);
    assert.doesNotMatch(source, /<(input|textarea|label|form)\b/i, route);
  }
});
