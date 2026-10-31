import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { createRecipe } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/ShareCreateRoute';
import { action } from './ShareCreateRoute';

const post = (db: D1Database, slug: string, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  return action(fake<Route.ActionArgs>({ request: new Request('http://x/', { method: 'POST' }), params: { slug }, context }));
};

describe('ShareCreateRoute', () => {
  let slug: string;
  test.beforeEach(async ({ db }) => {
    await createUser(db, 'oma@example.com', 'Oma');
    slug = await createRecipe(db, { title: 'Appeltaart', author: 'Oma' });
  });

  test('answers the token and the end date of a new share', async ({ db }) => {
    const response = await post(db, slug);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { token: string; expiresAt: string | null; created: boolean };
    assert.equal(typeof body.token, 'string');
    assert.equal(body.expiresAt, null);
    assert.equal(body.created, true);
  });

  test('a second call answers the same token and says it is not new', async ({ db }) => {
    const first = (await (await post(db, slug)).json()) as { token: string };
    const second = (await (await post(db, slug)).json()) as { token: string; created: boolean };
    assert.equal(second.token, first.token);
    assert.equal(second.created, false);
  });

  test('an unknown recipe gives 404', async ({ db }) => {
    assert.equal((await post(db, 'does-not-exist')).status, 404);
  });

  test('an unknown user gives 403', async ({ db }) => {
    assert.equal((await post(db, slug, 'vreemd@example.com')).status, 403);
  });
});
