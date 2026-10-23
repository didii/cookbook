import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getPhoto, storePhoto } from '~app/shared/photos.server';
import { createRecipe, listRecipes } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { createTestDb } from '~testing/db';
import { defined } from '~testing/defined';
import { fake } from '~testing/fake';
import type { Route as LikeRoute } from './+types/LikeUpdateRoute';
import type { Route as NoteRoute } from './+types/NoteUpdateRoute';
import type { Route } from './+types/RecipePageRoute';
import { action as likeAction } from './LikeUpdateRoute';
import { action as noteAction } from './NoteUpdateRoute';
import { action, loader } from './RecipePageRoute';

// Real loader and action against an in-memory D1 holding a recipe the test inserted.
let db: D1Database;
let photos: R2Bucket;
let dispose: () => Promise<void>;

beforeAll(async () => {
  ({ db, photos, dispose } = await createTestDb());
});

afterAll(() => dispose());

const load = (slug: string, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  context.set(userEmailContext, email);
  return loader(fake<Route.LoaderArgs>({ params: { slug }, context }));
};

describe('recipe-viewing › Unknown slug', () => {
  test('the loader answers 404', async () => {
    await assert.rejects(load('does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
  });
});

const viewCount = async (slug: string) =>
  (await db
    .prepare('SELECT COUNT(*) AS n FROM recipe_views v JOIN recipes r ON r.id = v.recipe_id WHERE r.slug = ?')
    .bind(slug)
    .first<{ n: number }>())!.n;

describe('recipe-new-marker › Opening the recipe', () => {
  test('the recipe is new before and not new after opening', async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Net geopend', author: 'Papa', createdBy: 'papa@example.com' });
    const isNew = async () => (await listRecipes(db, 'oma@example.com', new Date())).find((r) => r.slug === slug)?.isNew;
    assert.equal(await isNew(), true);
    await load(slug);
    assert.equal(await isNew(), false);
  });
});

describe('recipe-new-marker › Opening twice', () => {
  test('only one view is recorded', async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Twee keer', author: 'Oma' });
    await load(slug);
    await load(slug);
    assert.equal(await viewCount(slug), 1);
  });
});

describe('RecipePageRoute loader', () => {
  test('opening an unknown recipe records no view', async () => {
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
});

const remove = (slug: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  return action(fake<Route.ActionArgs>({ params: { slug }, context }));
};

describe('recipe-deletion › Recipe is deleted', () => {
  let slug: string;
  let response: Response;
  beforeAll(async () => {
    slug = await createRecipe(db, { title: 'Te verwijderen', author: 'Oma', ingredients: [{ name: 'bloem' }], steps: [{ body: 'Mengen.' }] });
    response = await remove(slug);
  });

  test('the action redirects to the overview', () => {
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/');
  });

  test('the recipe can no longer be loaded', async () => {
    await assert.rejects(load(slug), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
  });

  test('its ingredients are gone', async () => {
    assert.equal(
      (await db.prepare('SELECT COUNT(*) AS n FROM ingredients WHERE recipe_id NOT IN (SELECT id FROM recipes)').first<{ n: number }>())!.n,
      0,
    );
  });

  test('it is gone from the list', async () => {
    assert.ok(!(await listRecipes(db, 'oma@example.com', new Date())).some((r) => r.slug === slug));
  });
});

describe('recipe-deletion › Photo is deleted', () => {
  test('the stored photo is removed', async () => {
    const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
    assert.ok('path' in stored);
    const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: stored.path });
    await remove(slug);
    assert.equal(await getPhoto(photos, stored.path.slice('/foto/'.length)), null);
  });
});

describe('recipe-deletion › Unknown recipe', () => {
  test('the action answers 404', async () => {
    await assert.rejects(remove('does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
  });
});

const post = (handler: typeof likeAction | typeof noteAction, slug: string, fields: Record<string, string>, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  context.set(userEmailContext, email);
  const request = new Request('http://x/', { method: 'POST', body: new URLSearchParams(fields) });
  return handler(fake<LikeRoute.ActionArgs & NoteRoute.ActionArgs>({ request, params: { slug }, context })) as Promise<Response>;
};

describe('LikeUpdateRoute', () => {
  test('stores and removes the like and the loader returns it', async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Favoriet', author: 'Oma' });
    assert.equal((await post(likeAction, slug, { liked: 'true' })).status, 204);
    assert.equal((await load(slug)).liked, true);
    assert.equal((await post(likeAction, slug, { liked: 'false' })).status, 204);
    assert.equal((await load(slug)).liked, false);
  });

  describe('refuses what it cannot store', () => {
    let slug: string;
    beforeAll(async () => {
      await createUser(db, 'oma@example.com', 'Oma');
      slug = await createRecipe(db, { title: 'Streng', author: 'Oma' });
    });

    test('an unknown liked value gives 400', async () => {
      assert.equal((await post(likeAction, slug, { liked: 'maybe' })).status, 400);
    });

    test('a missing liked value gives 400', async () => {
      assert.equal((await post(likeAction, slug, {})).status, 400);
    });

    test('an unknown recipe gives 404', async () => {
      assert.equal((await post(likeAction, 'does-not-exist', { liked: 'true' })).status, 404);
    });

    test('an unknown user gives 403', async () => {
      assert.equal((await post(likeAction, slug, { liked: 'true' }, 'vreemd@example.com')).status, 403);
    });
  });
});

describe('NoteUpdateRoute', () => {
  test('stores the note and the loader returns it', async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    const slug = await createRecipe(db, { title: 'Met notitie', author: 'Oma' });
    assert.equal((await post(noteAction, slug, { note: 'minder zout' })).status, 204);
    assert.equal((await load(slug)).note, 'minder zout');
    assert.equal((await post(noteAction, slug, { note: '  ' })).status, 204);
    assert.equal((await load(slug)).note, '');
  });

  describe('refuses what it cannot store', () => {
    let slug: string;
    beforeAll(async () => {
      await createUser(db, 'oma@example.com', 'Oma');
      slug = await createRecipe(db, { title: 'Streng', author: 'Oma' });
    });

    test('an unknown recipe gives 404', async () => {
      assert.equal((await post(noteAction, 'does-not-exist', { note: 'x' })).status, 404);
    });

    test('an unknown user gives 403', async () => {
      assert.equal((await post(noteAction, slug, { note: 'x' }, 'vreemd@example.com')).status, 403);
    });

    test('a missing note gives 400', async () => {
      assert.equal((await post(noteAction, slug, {})).status, 400);
    });

    test('a note of 4000 characters is accepted', async () => {
      assert.equal((await post(noteAction, slug, { note: 'x'.repeat(4000) })).status, 204);
    });
  });
});

describe('recipe-note › Note too long', () => {
  let slug: string;
  beforeAll(async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    slug = await createRecipe(db, { title: 'Lang', author: 'Oma' });
  });

  test('the action answers 413', async () => {
    assert.equal((await post(noteAction, slug, { note: 'x'.repeat(4001) })).status, 413);
  });

  test('the note stays empty', async () => {
    await post(noteAction, slug, { note: 'x'.repeat(4001) });
    assert.equal((await load(slug)).note, '');
  });
});
