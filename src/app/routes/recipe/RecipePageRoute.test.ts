import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getPhoto, storePhoto } from '~app/shared/photos.server';
import { createRecipe, listRecipes } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { defined } from '~testing/defined';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/RecipePageRoute';
import { action, loader } from './RecipePageRoute';

const load = (db: D1Database, photos: R2Bucket, slug: string, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  context.set(userEmailContext, email);
  return loader(fake<Route.LoaderArgs>({ params: { slug }, context }));
};

describe('recipe-viewing › Unknown slug', () => {
  test('the loader answers 404', async ({ db, photos }) => {
    await assert.rejects(load(db, photos, 'does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
  });
});

const viewCount = async (db: D1Database, slug: string) =>
  (await db
    .prepare('SELECT COUNT(*) AS n FROM recipe_views v JOIN recipes r ON r.id = v.recipe_id WHERE r.slug = ?')
    .bind(slug)
    .first<{ n: number }>())!.n;

describe('recipe-new-marker › Opening the recipe', () => {
  test('the recipe is new before and not new after opening', async ({ db, photos }) => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Net geopend', author: 'Papa', createdBy: 'papa@example.com' });
    const isNew = async () => (await listRecipes(db, 'oma@example.com', new Date())).find((r) => r.slug === slug)?.isNew;
    assert.equal(await isNew(), true);
    await load(db, photos, slug);
    assert.equal(await isNew(), false);
  });
});

describe('recipe-new-marker › Opening twice', () => {
  test('only one view is recorded', async ({ db, photos }) => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Twee keer', author: 'Oma' });
    await load(db, photos, slug);
    await load(db, photos, slug);
    assert.equal(await viewCount(db, slug), 1);
  });
});

describe('RecipePageRoute loader', () => {
  test('opening an unknown recipe records no view', async ({ db, photos }) => {
    await assert.rejects(load(db, photos, 'does-not-exist'));
    assert.equal(
      (await db.prepare('SELECT COUNT(*) AS n FROM recipe_views WHERE recipe_id NOT IN (SELECT id FROM recipes)').first<{ n: number }>())!.n,
      0,
    );
  });

  test('the page gets the steps of the database with their chips', async ({ db, photos }) => {
    const steps = [
      { body: 'Bak 30 minuten op 180 graden.', ingredients: [{ quantityText: '', name: 'boter' }], ovenTemperature: 180, timer: { minutes: 30 } },
    ];
    const slug = await createRecipe(db, { title: 'Uit de database', author: 'Oma', steps });
    const { recipe, steps: loaded } = await load(db, photos, slug);
    assert.equal(recipe.title, 'Uit de database');
    assert.deepEqual(defined(loaded), steps);
  });
});

const remove = (db: D1Database, photos: R2Bucket, slug: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  return action(fake<Route.ActionArgs>({ params: { slug }, context }));
};

describe('recipe-deletion › Recipe is deleted', () => {
  let slug: string;
  let response: Response;
  test.beforeAll(async ({ db, photos }) => {
    slug = await createRecipe(db, { title: 'Te verwijderen', author: 'Oma', ingredients: [{ name: 'bloem' }], steps: [{ body: 'Mengen.' }] });
    response = await remove(db, photos, slug);
  });

  test('the action redirects to the overview', () => {
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/');
  });

  test('the recipe can no longer be loaded', async ({ db, photos }) => {
    await assert.rejects(load(db, photos, slug), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
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
