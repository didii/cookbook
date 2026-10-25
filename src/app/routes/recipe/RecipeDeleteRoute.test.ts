import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { getPhoto, storePhoto } from '~app/shared/photos.server';
import { createRecipe, getRecipe, listRecipes } from '~app/shared/recipes.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/RecipeDeleteRoute';
import { action } from './RecipeDeleteRoute';

const remove = (db: D1Database, photos: R2Bucket, slug: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  return action(fake<Route.ActionArgs>({ params: { slug }, context }));
};

describe('recipe-deletion › Recipe is deleted', () => {
  let slug: string;
  let response: Response;
  test.beforeEach(async ({ db, photos }) => {
    slug = await createRecipe(db, { title: 'Te verwijderen', author: 'Oma', ingredients: [{ name: 'bloem' }], steps: [{ body: 'Mengen.' }] });
    response = await remove(db, photos, slug);
  });

  test('the action redirects to the overview', () => {
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/');
  });

  test('the recipe can no longer be found', async ({ db }) => {
    assert.equal(await getRecipe(db, slug), undefined);
  });

  test('its ingredients are gone', async ({ db }) => {
    assert.equal(
      (await db.prepare('SELECT COUNT(*) AS n FROM ingredients WHERE recipe_id NOT IN (SELECT id FROM recipes)').first<{ n: number }>())!.n,
      0,
    );
  });

  test('it is gone from the list', async ({ db }) => {
    assert.ok(!(await listRecipes(db, 'oma@example.com', new Date())).some((r) => r.slug === slug));
  });
});

describe('recipe-deletion › Photo is deleted', () => {
  test('the stored photo is removed', async ({ db, photos }) => {
    const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
    assert.ok('path' in stored);
    const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: stored.path });
    await remove(db, photos, slug);
    assert.equal(await getPhoto(photos, stored.path.slice('/foto/'.length)), null);
  });
});

describe('recipe-deletion › Unknown recipe', () => {
  test('the action answers 404', async ({ db, photos }) => {
    await assert.rejects(remove(db, photos, 'does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
  });
});
