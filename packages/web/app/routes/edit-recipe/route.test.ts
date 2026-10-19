import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~/.server/context';
import { getPhoto, storePhoto } from '~/.server/photos';
import { getRecipe } from '~/.server/recipes';
import type { Route } from './+types/route';
import { action, loader } from './route';

// Real loader and action against an in-memory D1 holding a recipe the test inserted.
let db: D1Database;
let photos: R2Bucket;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, photos, dispose } = await createTestDb());
  await db
    .prepare("INSERT INTO recipes (slug, title, author, time, servings, intro, image) VALUES ('soep', 'Soep', 'Oma', '1u', 4, 'Warm', '/soep.jpg')")
    .run();
});

after(() => dispose());

const contextWithDb = () => {
  const context = new RouterContextProvider();
  context.set(envContext, { DB: db, PHOTOS: photos } as Partial<Env> as Env);
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
  assert.deepEqual(values, {
    title: 'Soep',
    author: 'Oma',
    servings: '4',
    time: '1u',
    intro: 'Warm',
    image: '/soep.jpg',
    ingredients: [],
    steps: [],
  });
});

test('recipe-ingredient-editing › Stored ingredients come back as lines', async () => {
  await db.batch([
    db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('lijst', 'Lijst', 'Oma')"),
    db.prepare("INSERT INTO ingredients (recipe_id, position, name, quantity_text) SELECT id, 1, 'zout', '' FROM recipes WHERE slug = 'lijst'"),
    db.prepare("INSERT INTO ingredients (recipe_id, position, name, quantity_text) SELECT id, 0, 'bloem', '250 g' FROM recipes WHERE slug = 'lijst'"),
  ]);
  assert.deepEqual((await load('lijst')).values.ingredients, ['250 g bloem', 'zout']);
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

const upload = async () => {
  const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
  assert.ok('path' in stored);
  return stored.path;
};
const isStored = async (path: string) => (await getPhoto(photos, path.slice('/foto/'.length))) !== null;
const addRecipe = (slug: string, image: string | null) =>
  db.prepare("INSERT INTO recipes (slug, title, author, image) VALUES (?, 'T', 'Oma', ?)").bind(slug, image).run();

test('recipe-photo › Replaced photo is deleted', async () => {
  const [old, next] = [await upload(), await upload()];
  await addRecipe('vervangen', old);
  await submit('vervangen', { title: 'T', author: 'Oma', image: next });
  assert.equal((await getRecipe(db, 'vervangen'))?.image, next);
  assert.equal(await isStored(old), false);
  assert.equal(await isStored(next), true);
  // Removing the photo deletes it too
  await submit('vervangen', { title: 'T', author: 'Oma', image: '' });
  assert.equal((await getRecipe(db, 'vervangen'))?.image, null);
  assert.equal(await isStored(next), false);
});

test('recipe-photo › Non-upload images are never deleted', async () => {
  await addRecipe('voorbeeld', '/img/appeltaart.jpg');
  await photos.put('photos/other', 'x');
  await submit('voorbeeld', { title: 'T', author: 'Oma', image: await upload() });
  assert.equal(
    (await photos.list()).objects.some((o) => o.key === 'photos/other'),
    true,
  );
  // An unchanged upload is kept
  const kept = await upload();
  await addRecipe('houdt', kept);
  await submit('houdt', { title: 'T2', author: 'Oma', image: kept });
  assert.equal(await isStored(kept), true);
});

test('a forged external image link is dropped, a stored one is kept', async () => {
  await addRecipe('vals', null);
  await submit('vals', { title: 'T', author: 'Oma', image: 'https://evil.example/x.jpg' });
  assert.equal((await getRecipe(db, 'vals'))?.image, null);
  await addRecipe('oud', '/img/oud.jpg');
  await submit('oud', { title: 'T2', author: 'Oma', image: '/img/oud.jpg' });
  assert.equal((await getRecipe(db, 'oud'))?.image, '/img/oud.jpg');
});

// Both routes must render the shared editor and write no fields of their own, so the UI can only differ in values, heading and cancel target.
test('recipe-editing › Same form for new and existing recipes', () => {
  for (const route of ['../edit-recipe/route.tsx', '../new-recipe/route.tsx']) {
    const source = readFileSync(new URL(route, import.meta.url), 'utf8');
    assert.match(source, /<RecipeEditor\b/, route);
    assert.doesNotMatch(source, /<(input|textarea|label|form)\b/i, route);
  }
});

test('an edit posts its ingredient lines and a bad row refuses it', async () => {
  const ingredients = (...texts: string[]) => JSON.stringify(texts.map((text) => ({ text })));
  await submit('soep', { title: 'Soep', author: 'Oma', ingredients: ingredients('250 g bloem', '', '2 grote uien') });
  assert.deepEqual((await getRecipe(db, 'soep'))?.ingredients, [
    { quantity_text: '250 g', name: 'bloem' },
    { quantity_text: '2', name: 'grote uien' },
  ]);
  const res = (await submit('soep', { title: 'Soep', author: 'Oma', ingredients: ingredients('zout', '250 g') })) as {
    data: { errors: { ingredients: object } };
  };
  assert.deepEqual(Object.keys(res.data.errors.ingredients), ['1']);
  assert.equal((await getRecipe(db, 'soep'))?.ingredients.length, 2);
});

test('an edit posted without an ingredients field keeps the stored ingredients', async () => {
  await submit('soep', { title: 'Soep', author: 'Oma', ingredients: JSON.stringify([{ text: '2 uien' }]) });
  await submit('soep', { title: 'Soep 2', author: 'Oma' });
  assert.deepEqual((await getRecipe(db, 'soep'))?.ingredients, [{ quantity_text: '2', name: 'uien' }]);
});
