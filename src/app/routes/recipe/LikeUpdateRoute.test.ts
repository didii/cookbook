import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { createRecipe, getMemberRecipeData } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/LikeUpdateRoute';
import { action } from './LikeUpdateRoute';

const post = (db: D1Database, slug: string, fields: Record<string, string>, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  const request = new Request('http://x/', { method: 'POST', body: new URLSearchParams(fields) });
  return action(fake<Route.ActionArgs>({ request, params: { slug }, context }));
};

describe('LikeUpdateRoute', () => {
  test('stores and removes the like', async ({ db }) => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Favoriet', author: 'Oma' });
    assert.equal((await post(db, slug, { liked: 'true' })).status, 204);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, true);
    assert.equal((await post(db, slug, { liked: 'false' })).status, 204);
    assert.equal((await getMemberRecipeData(db, 'oma@example.com', slug)).liked, false);
  });

  describe('refuses what it cannot store', () => {
    let slug: string;
    test.beforeEach(async ({ db }) => {
      await createUser(db, 'oma@example.com', 'Oma');
      slug = await createRecipe(db, { title: 'Streng', author: 'Oma' });
    });

    test('an unknown liked value gives 400', async ({ db }) => {
      assert.equal((await post(db, slug, { liked: 'maybe' })).status, 400);
    });

    test('a missing liked value gives 400', async ({ db }) => {
      assert.equal((await post(db, slug, {})).status, 400);
    });

    test('an unknown recipe gives 404', async ({ db }) => {
      assert.equal((await post(db, 'does-not-exist', { liked: 'true' })).status, 404);
    });

    test('an unknown user gives 403', async ({ db }) => {
      assert.equal((await post(db, slug, { liked: 'true' }, 'vreemd@example.com')).status, 403);
    });
  });
});
