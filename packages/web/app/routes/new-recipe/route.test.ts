import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { getRecipe } from '~/.server/recipes';
import type { Route } from './+types/route';
import { action } from './route';

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

const count = async () => (await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n;

test('recipe-creation › Recipe is created', async () => {
  const res = (await submit({ title: ' Soep ', author: 'Oma', servings: '4' })) as Response;
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/recepten/soep');
  const r = await getRecipe(db, 'soep');
  assert.deepEqual([r?.title, r?.author, r?.servings], ['Soep', 'Oma', 4]);
  assert.equal((await db.prepare("SELECT created_by FROM recipes WHERE slug = 'soep'").first())?.created_by, 'oma@example.com');
});

test('recipe-creation › Missing title', async () => {
  const before = await count();
  const res = (await submit({ title: '   ', author: 'Oma', servings: '4' })) as {
    init: { status: number };
    data: { errors: object; values: object };
  };
  assert.equal(res.init.status, 400);
  assert.deepEqual(Object.keys(res.data.errors), ['title']);
  assert.equal(await count(), before);
});

test('recipe-creation › Invalid servings', async () => {
  const before = await count();
  for (const servings of ['0', '-2', '2.5', 'veel', '']) {
    const res = (await submit({ title: 'Taart', author: 'Oma', servings })) as { init: { status: number }; data: { errors: object } };
    assert.equal(res.init.status, 400, servings);
    assert.deepEqual(Object.keys(res.data.errors), ['servings'], servings);
  }
  assert.equal(await count(), before);
});
