import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { getRecipe } from '~/.server/recipes';
import type { Route } from './+types/route';
import { action, loader } from './route';

// Action-level tests: real action, real queries against an in-memory D1.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const submit = (fields: Record<string, string>) => {
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db } as Partial<Env> as Env);
  context.set(userEmailContext, 'oma@example.com');
  return action({
    request: new Request('http://localhost/recepten/nieuw', { method: 'POST', body: new URLSearchParams(fields) }),
    context,
  } as Partial<Route.ActionArgs> as Route.ActionArgs);
};

test('recipe-creation › Recipe is created', async () => {
  const res = (await submit({ title: ' Soep ', author: 'Oma', servings: '4' })) as Response;
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/recepten/soep');
  const r = await getRecipe(db, 'soep');
  assert.deepEqual([r?.title, r?.author, r?.servings], ['Soep', 'Oma', 4]);
  assert.equal((await db.prepare("SELECT created_by FROM recipes WHERE slug = 'soep'").first())?.created_by, 'oma@example.com');
});

test('recipe-creation › Time, intro and image are stored', async () => {
  const image = '/foto/00000000-0000-4000-8000-000000000000.webp';
  await submit({ title: 'Compleet', author: 'Oma', time: ' 45 min ', intro: 'Lekker', image });
  const r = await getRecipe(db, 'compleet');
  assert.deepEqual([r?.time, r?.intro, r?.image], ['45 min', 'Lekker', image]);
});

test('recipe-creation › Servings left empty', async () => {
  const res = (await submit({ title: 'Zonder porties', author: 'Oma', servings: '' })) as Response;
  assert.equal(res.headers.get('Location'), '/recepten/zonder-porties');
  assert.equal((await getRecipe(db, 'zonder-porties'))?.servings, null);
});

// The filter runs in the browser (Base UI's Autocomplete with a base-sensitivity filter), so this needs a real browser; checked by hand.
test.todo('recipe-creation › Suggestions ignore letter case');

// Removed by edit-recipe-picture (now recipe-photo); kept until that change is archived, because pnpm test checks these names against openspec/specs.
test.todo('recipe-creation › Preview of the image');
test.todo('recipe-creation › Image cannot be loaded');

// These need a browser (visible asterisk and focus), so they are checked by hand.
test.todo('recipe-creation › Required fields are marked');
test.todo('recipe-creation › Errors are announced and focused');

// Only the action stores anything: opening the editor (the loader) leaves the database as it was.
test('recipe-form › Nothing stored before saving', async () => {
  const count = async () => (await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n;
  const before = await count();
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db } as Partial<Env> as Env);
  await loader({ context } as Partial<Route.LoaderArgs> as Route.LoaderArgs);
  assert.equal(await count(), before);
});

test('a new recipe stores its non-blank steps in order', async () => {
  await submit({ title: 'Met stappen', author: 'Oma', steps: JSON.stringify([{ body: 'een' }, { body: '' }, { body: 'twee' }]) });
  assert.deepEqual((await getRecipe(db, 'met-stappen'))?.steps, ['een', 'twee']);
});
