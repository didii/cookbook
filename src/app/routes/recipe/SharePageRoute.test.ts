import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, publicRequestContext } from '~app/shared/context.server';
import { createRecipe, setLike, setNote } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/SharePageRoute';
import { loader } from './SharePageRoute';

/** Calls the loader as a public request: no member email in the context. */
const load = (db: D1Database, slug: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(publicRequestContext, true);
  return loader(fake<Route.LoaderArgs>({ params: { slug }, context }));
};

const viewCount = async (db: D1Database) => (await db.prepare('SELECT COUNT(*) AS n FROM recipe_views').first<{ n: number }>())!.n;

describe('shared-recipe-view › Page without identity', () => {
  test('the loader returns the recipe without a member', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Appeltaart', author: 'Oma', ingredients: [{ name: 'appels' }], steps: [{ body: 'bakken' }] });
    const { recipe, steps } = await load(db, slug);
    assert.equal(recipe.title, 'Appeltaart');
    assert.equal(recipe.ingredients.length, 1);
    assert.equal(steps.length, 1);
  });
});

describe('shared-recipe-view › Unknown recipe', () => {
  test('the loader answers 404', async ({ db }) => {
    await assert.rejects(load(db, 'does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
  });
});

describe('shared-recipe-view › No member data in the response', () => {
  test('the data has no email, member name, like, note or other recipe', async ({ db }) => {
    await createUser(db, 'oma@example.com', 'Oma Lies');
    const slug = await createRecipe(db, { title: 'Appeltaart', author: 'Papa', createdBy: 'oma@example.com' });
    await createRecipe(db, { title: 'Een ander recept', author: 'Papa' });
    await setLike(db, 'oma@example.com', slug, true);
    await setNote(db, 'oma@example.com', slug, 'geheime notitie');
    const json = JSON.stringify(await load(db, slug));
    for (const secret of ['oma@example.com', 'Oma Lies', 'geheime notitie', 'Een ander recept', 'liked', 'note', 'created_by'])
      assert.ok(!json.includes(secret), secret);
  });
});

describe('shared-recipe-view › Viewing is not recorded', () => {
  test('no row appears in recipe_views', async ({ db }) => {
    const slug = await createRecipe(db, { title: 'Appeltaart', author: 'Oma' });
    await load(db, slug);
    assert.equal(await viewCount(db), 0);
  });
});
