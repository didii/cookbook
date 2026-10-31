import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { describe, vi } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { deletePhoto, getPhoto, storePhoto } from '~app/shared/photos.server';
import { createRecipe, deleteRecipe, getRecipe } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { cleanup, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/NewRecipePageRoute';
import { emptyDraftSeed } from './lib/draft';
import { recipeSeed } from './lib/recipeSeed';
import NewRecipePage, { action, loader } from './NewRecipePageRoute';

// Passes through to the real form and records the props the route gave it.
const spy = vi.hoisted(() => ({ props: undefined as { heading: string; canImport?: boolean } | undefined }));
vi.mock('./lib/NewRecipeForm', async (importOriginal) => {
  const original = await importOriginal<typeof import('./lib/NewRecipeForm')>();
  return {
    NewRecipeForm: (props: Parameters<typeof original.NewRecipeForm>[0]) => {
      spy.props = props;
      return original.NewRecipeForm(props);
    },
  };
});

const submit = (db: D1Database, fields: Record<string, string>, photos?: R2Bucket) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  context.set(userEmailContext, 'oma@example.com');
  return action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/recepten/nieuw', { method: 'POST', body: new URLSearchParams(fields) }),
      context,
    }),
  );
};

describe('recipe-creation › Recipe is created', () => {
  let res: Response;

  test.beforeEach(async ({ db }) => {
    res = (await submit(db, { title: ' Soep ', author: 'Oma', servings: '4' })) as Response;
  });

  test('the answer is a redirect', () => {
    assert.equal(res.status, 302);
  });

  test('the redirect goes to the new recipe', () => {
    assert.equal(res.headers.get('Location'), '/recepten/soep');
  });

  test('the title, author and servings are stored', async ({ db }) => {
    const r = await getRecipe(db, 'soep');
    assert.deepEqual([r?.title, r?.author, r?.servings], ['Soep', 'Oma', 4]);
  });

  test('the creator is stored', async ({ db }) => {
    assert.equal((await db.prepare("SELECT created_by FROM recipes WHERE slug = 'soep'").first())?.created_by, 'oma@example.com');
  });
});

describe('recipe-creation › Time, intro and image are stored', () => {
  test('the time, intro and image are stored', async ({ db }) => {
    const image = '/foto/00000000-0000-4000-8000-000000000000.webp';
    await submit(db, { title: 'Compleet', author: 'Oma', time: ' 45 min ', intro: 'Lekker', image });
    const r = await getRecipe(db, 'compleet');
    assert.deepEqual([r?.time, r?.intro, r?.image], ['45 min', 'Lekker', image]);
  });
});

/** A recipe with a stored photo, the way a copy form is opened on it; returns the photo path. */
const withPhoto = async (db: D1Database, photos: R2Bucket) => {
  const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).buffer);
  assert.ok('path' in stored);
  await db.prepare("INSERT INTO recipes (slug, title, author, image) VALUES ('origineel', 'Soep', 'Oma', ?)").bind(stored.path).run();
  return stored.path;
};

describe('recipe-creation › The copy gets its own photo', () => {
  test('the new recipe has a different photo path', async ({ db, photos }) => {
    const path = await withPhoto(db, photos);
    await submit(db, { title: 'Soep kopie', author: 'Oma', image: path }, photos);
    const image = (await getRecipe(db, 'soep-kopie'))?.image;
    assert.ok(image);
    assert.notEqual(image, path);
  });

  test('the copy has the same content', async ({ db, photos }) => {
    const path = await withPhoto(db, photos);
    await submit(db, { title: 'Soep kopie', author: 'Oma', image: path }, photos);
    const copy = await getPhoto(photos, (await getRecipe(db, 'soep-kopie'))!.image!.slice('/foto/'.length));
    assert.deepEqual([...new Uint8Array((await copy?.arrayBuffer()) ?? [])], [0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  });

  test('the original keeps its photo', async ({ db, photos }) => {
    const path = await withPhoto(db, photos);
    await submit(db, { title: 'Soep kopie', author: 'Oma', image: path }, photos);
    assert.equal((await getRecipe(db, 'origineel'))?.image, path);
    assert.ok(await getPhoto(photos, path.slice('/foto/'.length)));
  });

  test('a photo no recipe uses yet is kept as it is', async ({ db, photos }) => {
    const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
    assert.ok('path' in stored);
    await submit(db, { title: 'Eigen foto', author: 'Oma', image: stored.path }, photos);
    assert.equal((await getRecipe(db, 'eigen-foto'))?.image, stored.path);
  });
});

describe('recipe-creation › Deleting the original keeps the copy photo', () => {
  test('the copy still has its photo', async ({ db, photos }) => {
    const path = await withPhoto(db, photos);
    await submit(db, { title: 'Soep kopie', author: 'Oma', image: path }, photos);
    await deleteRecipe(db, 'origineel');
    await deletePhoto(photos, path);
    assert.ok(await getPhoto(photos, (await getRecipe(db, 'soep-kopie'))!.image!.slice('/foto/'.length)));
  });
});

describe('recipe-creation › Servings left empty', () => {
  let res: Response;

  test.beforeEach(async ({ db }) => {
    res = (await submit(db, { title: 'Zonder porties', author: 'Oma', servings: '' })) as Response;
  });

  test('the recipe is created', () => {
    assert.equal(res.headers.get('Location'), '/recepten/zonder-porties');
  });

  test('the servings are empty', async ({ db }) => {
    assert.equal((await getRecipe(db, 'zonder-porties'))?.servings, null);
  });
});

const tagsField = (...names: string[]) => ({ tags: JSON.stringify(names) });

describe('recipe-form › Tags are stored with the recipe', () => {
  test('the recipe has the picked tags', async ({ db }) => {
    await submit(db, { title: 'Kerstsoep', author: 'Oma', ...tagsField('Soep', 'Kerst') });
    assert.deepEqual((await getRecipe(db, 'kerstsoep'))?.tags, ['Kerst', 'Soep']);
  });

  test('the new tag is a stored tag', async ({ db }) => {
    await submit(db, { title: 'Kerstsoep', author: 'Oma', ...tagsField('Soep', 'Kerst') });
    assert.ok(await db.prepare("SELECT 1 FROM tags WHERE name = 'Kerst'").first());
  });
});

describe('recipe-form › Too long tag is refused on save', () => {
  let res: { init?: { status?: number }; data: { errors: Record<string, string> } };

  test.beforeEach(async ({ db }) => {
    res = (await submit(db, { title: 'Te lang', author: 'Oma', ...tagsField('a'.repeat(101)) })) as unknown as typeof res;
  });

  test('the editor is shown again with a message at the tags field', () => {
    assert.ok(res.data.errors.tags);
  });

  test('nothing is stored', async ({ db }) => {
    assert.equal(await getRecipe(db, 'te-lang'), undefined);
  });
});

describe('recipe-form › Many tags are accepted', () => {
  test('the recipe has all 30', async ({ db }) => {
    const names = Array.from({ length: 30 }, (_, i) => `Tag ${i}`);
    await submit(db, { title: 'Veel tags', author: 'Oma', ...tagsField(...names) });
    assert.equal((await getRecipe(db, 'veel-tags'))?.tags.length, 30);
  });
});

/** The new recipe page as the router shows it, with what a refused submit hands back (nothing on first opening). */
const form = (actionData?: { errors: Record<string, string>; values: typeof emptyDraftSeed }) => {
  const props = fake<Route.ComponentProps>({
    loaderData: { seed: emptyDraftSeed, authors: ['Oma', 'Mama'], tags: [], tile: 0, seal: undefined },
    actionData,
  });
  return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <NewRecipePage {...props} /> }])} />);
};

describe('the new recipe page', () => {
  test('hands the loaded authors to the editor', async () => {
    form();
    const author = screen.getByTestId('AuthorInput-field');
    openAutocomplete(author);
    fireEvent.change(author, { target: { value: 'mam' } });
    const options = await screen.findAllByTestId('AuthorInput-option');
    assert.deepEqual(
      options.map((o) => o.textContent),
      ['Mama'],
    );
  });

  test('hands its heading to the editor', () => {
    form();
    assert.equal(screen.getByTestId('RecipeEditor-heading').textContent, 'Nieuw recept');
  });

  test('sends cancel to the home page', () => {
    form();
    assert.equal(screen.getByTestId('RecipeEditor-cancel').getAttribute('href'), '/');
  });

  test('hands the errors of a refused submit to the editor', () => {
    form({ errors: { title: 'Vul een titel in.' }, values: emptyDraftSeed });
    assert.equal(document.getElementById('title')!.getAttribute('aria-invalid'), 'true');
  });

  test('hands the posted values of a refused submit to the editor', () => {
    form({ errors: { title: 'Vul een titel in.' }, values: { ...emptyDraftSeed, title: 'Soep', author: 'Oma' } });
    assert.equal((document.getElementById('title') as HTMLInputElement).value, 'Soep');
  });
});

// Only the action stores anything: opening the editor (the loader) leaves the database as it was.
describe('recipe-form › Nothing stored before saving', () => {
  test('opening the editor leaves the database as it was', async ({ db }) => {
    const count = async () => (await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n;
    const rowsBefore = await count();
    const context = new RouterContextProvider();
    context.set(envContext, fake<Env>({ DB: db }));
    context.set(userEmailContext, 'oma@example.com');
    await loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/recepten/nieuw'), context }));
    assert.equal(await count(), rowsBefore);
  });
});

describe('the new recipe loader tag categories', () => {
  test('only tags that have a category are in the map', async ({ db }) => {
    await db.batch([
      db.prepare("INSERT INTO categories (name) VALUES ('Gerecht')"),
      db.prepare("INSERT INTO tags (name, category_id) VALUES ('Soep', (SELECT id FROM categories WHERE name = 'Gerecht'))"),
      db.prepare("INSERT INTO tags (name) VALUES ('Winter')"),
    ]);
    const context = new RouterContextProvider();
    context.set(envContext, fake<Env>({ DB: db }));
    context.set(userEmailContext, 'oma@example.com');
    const { tagCategories, tags } = await loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/recepten/nieuw'), context }));
    assert.deepEqual(tagCategories, { Soep: 'Gerecht' });
    assert.deepEqual(tags, ['Soep', 'Winter']);
  });
});

const openCopy = (db: D1Database, query: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, 'oma@example.com');
  return loader(fake<Route.LoaderArgs>({ request: new Request(`http://localhost/recepten/nieuw${query}`), context }));
};
const count = async (db: D1Database) => (await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n;

const stored = (db: D1Database) =>
  createRecipe(db, {
    title: 'Appeltaart',
    author: 'Oma',
    servings: 8,
    time: '1u',
    intro: 'Warm',
    image: '/foto/00000000-0000-4000-8000-000000000000.jpg',
    source: 'Libelle',
    tags: ['Taart'],
    ingredients: [{ name: 'appels', quantityText: '4' }],
    steps: [{ body: 'Bak 30 minuten op 180 graden', ovenTemperature: 180, ingredients: [{ name: 'appels', quantityText: '4' }] }],
  });

describe('recipe-creation › The form is filled in from the recipe', () => {
  test('the loader seeds every field of the recipe', async ({ db }) => {
    await stored(db);
    const { seed } = await openCopy(db, '?kopie=appeltaart');
    // The mapping itself is tested in recipeSeed.test.ts.
    assert.deepEqual(seed, recipeSeed((await getRecipe(db, 'appeltaart'))!));
    assert.equal(seed.steps[0]?.ingredients[0]?.name, 'appels');
  });

  test('the page shows the seeded title', async ({ db }) => {
    await stored(db);
    cleanup();
    const props = fake<Route.ComponentProps>({ loaderData: await openCopy(db, '?kopie=appeltaart') });
    render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <NewRecipePage {...props} /> }])} />);
    assert.equal((document.getElementById('title') as HTMLInputElement).value, 'Appeltaart');
  });
});

describe('recipe-creation › Opening the copy stores nothing', () => {
  test('no recipe was added and the original is unchanged', async ({ db }) => {
    await stored(db);
    const before = await getRecipe(db, 'appeltaart');
    await openCopy(db, '?kopie=appeltaart');
    assert.equal(await count(db), 1);
    assert.deepEqual(await getRecipe(db, 'appeltaart'), before);
  });
});

describe('recipe-creation › Saving the copy makes a new recipe', () => {
  test('a new recipe with its own slug and the member as creator is stored', async ({ db }) => {
    await stored(db);
    const { seed } = await openCopy(db, '?kopie=appeltaart');
    await submit(db, { title: seed.title, author: seed.author });
    assert.equal(
      (await db.prepare("SELECT created_by FROM recipes WHERE slug = 'appeltaart-2'").first<{ created_by: string }>())?.created_by,
      'oma@example.com',
    );
  });

  test('the original is unchanged', async ({ db }) => {
    await stored(db);
    const before = await getRecipe(db, 'appeltaart');
    await submit(db, { title: 'Appeltaart', author: 'Oma' });
    assert.deepEqual(await getRecipe(db, 'appeltaart'), before);
  });
});

describe('recipe-creation › Unknown recipe', () => {
  test('the seed is the empty form with the calling name', async ({ db }) => {
    await createUser(db, 'oma@example.com', 'Jos');
    const { seed } = await openCopy(db, '?kopie=bestaat-niet');
    assert.deepEqual(seed, { ...emptyDraftSeed, author: 'Jos' });
  });
});

describe('the new recipe page without a copy', () => {
  test('starts with the empty seed and the calling name', async ({ db }) => {
    await createUser(db, 'oma@example.com', 'Jos');
    await stored(db);
    const { seed } = await openCopy(db, '');
    assert.deepEqual(seed, { ...emptyDraftSeed, author: 'Jos' });
  });
});

describe('a new recipe', () => {
  test('stores its non-blank steps in order', async ({ db }) => {
    await submit(db, { title: 'Met stappen', author: 'Oma', steps: JSON.stringify([{ body: 'een' }, { body: '' }, { body: 'twee' }]) });
    assert.deepEqual(
      (await getRecipe(db, 'met-stappen'))?.steps.map((s) => s.body),
      ['een', 'twee'],
    );
  });
});

const openFormAs = async (db: D1Database, email: string) => {
  cleanup();
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  const loaderData = await loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/recepten/nieuw'), context }));
  const props = fake<Route.ComponentProps>({ loaderData });
  return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <NewRecipePage {...props} /> }])} />);
};

describe('recipe-creation › Author is prefilled', () => {
  test('the author field holds the calling name', async ({ db }) => {
    await createUser(db, 'jos@example.com', 'Jos');
    await openFormAs(db, 'jos@example.com');
    assert.equal((document.getElementById('author') as HTMLInputElement).value, 'Jos');
  });
});

describe('recipe-creation › Prefilled author can be changed', () => {
  test('the changed author is stored', async ({ db }) => {
    await createUser(db, 'jos2@example.com', 'Jos');
    await openFormAs(db, 'jos2@example.com');
    const author = document.getElementById('author') as HTMLInputElement;
    fireEvent.change(author, { target: { value: 'Oma' } });
    fireEvent.change(document.getElementById('title')!, { target: { value: 'Oma kookt' } });
    // Submit what the form itself posts, not values copied from the inputs.
    const posted = Object.fromEntries(
      [...author.form!.elements].filter((e): e is HTMLInputElement => e instanceof HTMLInputElement && !!e.name).map((e) => [e.name, e.value]),
    );
    await submit(db, posted);
    assert.equal((await getRecipe(db, 'oma-kookt'))?.author, 'Oma');
  });
});

describe('recipe-creation › Prefill alone is not a draft', () => {
  test('nothing is kept on the device', async ({ db }) => {
    await createUser(db, 'jos3@example.com', 'Jos');
    await openFormAs(db, 'jos3@example.com');
    cleanup();
    assert.equal(window.localStorage.length, 0);
  });
});

describe('the new recipe source', () => {
  test('a trimmed source is stored', async ({ db }) => {
    await submit(db, { title: 'Met bron', author: 'Oma', source: ' Libelle ' });
    assert.equal((await getRecipe(db, 'met-bron'))?.source, 'Libelle');
  });

  test('a source of 500 characters is accepted', async ({ db }) => {
    await submit(db, { title: 'Grens', author: 'Oma', source: 'a'.repeat(500) });
    assert.equal((await getRecipe(db, 'grens'))?.source?.length, 500);
  });

  test('a source of 501 characters is refused and nothing is stored', async ({ db }) => {
    const res = (await submit(db, { title: 'Te lang', author: 'Oma', source: 'a'.repeat(501) })) as unknown as { init?: { status?: number } };
    assert.equal(res.init?.status, 400);
    assert.equal(await getRecipe(db, 'te-lang'), undefined);
  });
});

describe('recipe-import › Import is not offered elsewhere', () => {
  test('the plain new recipe form is not given the import option', () => {
    form();
    assert.ok(!spy.props?.canImport);
  });
});
