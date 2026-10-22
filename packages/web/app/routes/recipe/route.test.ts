import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { defined } from '~testing/defined';
import { fake } from '~testing/fake';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { getPhoto, storePhoto } from '~/.server/photos';
import { createRecipe, listRecipes } from '~/.server/recipes';
import { createUser } from '~/.server/users';
import type { Route as LikeRoute } from './+types/like';
import type { Route as NoteRoute } from './+types/note';
import type { Route } from './+types/route';
import { action as likeAction } from './like';
import { action as noteAction } from './note';
import { action, loader } from './route';

// Real loader and action against an in-memory D1 holding a recipe the test inserted.
let db: D1Database;
let photos: R2Bucket;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, photos, dispose } = await createTestDb());
});

after(() => dispose());

const load = (slug: string, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  context.set(userEmailContext, email);
  return loader(fake<Route.LoaderArgs>({ params: { slug }, context }));
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

const remove = (slug: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  return action(fake<Route.ActionArgs>({ params: { slug }, context }));
};

test('recipe-deletion › Recipe is deleted', async () => {
  const slug = await createRecipe(db, { title: 'Te verwijderen', author: 'Oma', ingredients: [{ name: 'bloem' }], steps: [{ body: 'Mengen.' }] });
  const response = await remove(slug);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('Location'), '/');
  await assert.rejects(load(slug), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
  assert.equal(
    (await db.prepare('SELECT COUNT(*) AS n FROM ingredients WHERE recipe_id NOT IN (SELECT id FROM recipes)').first<{ n: number }>())!.n,
    0,
  );
  assert.ok(!(await listRecipes(db, 'oma@example.com', new Date())).some((r) => r.slug === slug));
});

test('recipe-deletion › Photo is deleted', async () => {
  const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
  assert.ok('path' in stored);
  const slug = await createRecipe(db, { title: 'Met foto', author: 'Oma', image: stored.path });
  await remove(slug);
  assert.equal(await getPhoto(photos, stored.path.slice('/foto/'.length)), null);
});

test('recipe-deletion › Unknown recipe', async () => {
  await assert.rejects(remove('does-not-exist'), (thrown: { init?: { status?: number } }) => thrown.init?.status === 404);
});

const post = (handler: typeof likeAction | typeof noteAction, slug: string, fields: Record<string, string>, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  context.set(userEmailContext, email);
  const request = new Request('http://x/', { method: 'POST', body: new URLSearchParams(fields) });
  return handler(fake<LikeRoute.ActionArgs & NoteRoute.ActionArgs>({ request, params: { slug }, context })) as Promise<Response>;
};

test('the like route stores and removes the like and the loader returns it', async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  const slug = await createRecipe(db, { title: 'Favoriet', author: 'Oma' });
  assert.equal((await post(likeAction, slug, { liked: 'true' })).status, 204);
  assert.equal((await load(slug)).liked, true);
  assert.equal((await post(likeAction, slug, { liked: 'false' })).status, 204);
  assert.equal((await load(slug)).liked, false);
});

test('the note route stores the note and the loader returns it', async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  const slug = await createRecipe(db, { title: 'Met notitie', author: 'Oma' });
  assert.equal((await post(noteAction, slug, { note: 'minder zout' })).status, 204);
  assert.equal((await load(slug)).note, 'minder zout');
  assert.equal((await post(noteAction, slug, { note: '  ' })).status, 204);
  assert.equal((await load(slug)).note, '');
});

test('the like and note routes refuse what they cannot store', async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  const slug = await createRecipe(db, { title: 'Streng', author: 'Oma' });
  assert.equal((await post(likeAction, slug, { liked: 'maybe' })).status, 400);
  assert.equal((await post(likeAction, slug, {})).status, 400);
  assert.equal((await post(likeAction, 'does-not-exist', { liked: 'true' })).status, 404);
  assert.equal((await post(likeAction, slug, { liked: 'true' }, 'vreemd@example.com')).status, 403);
  assert.equal((await post(noteAction, 'does-not-exist', { note: 'x' })).status, 404);
  assert.equal((await post(noteAction, slug, { note: 'x' }, 'vreemd@example.com')).status, 403);
  assert.equal((await post(noteAction, slug, {})).status, 400);
  assert.equal((await post(noteAction, slug, { note: 'x'.repeat(4000) })).status, 204);
});

test('recipe-note › Note too long', async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  const slug = await createRecipe(db, { title: 'Lang', author: 'Oma' });
  assert.equal((await post(noteAction, slug, { note: 'x'.repeat(4001) })).status, 413);
  assert.equal((await load(slug)).note, '');
});
