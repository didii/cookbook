import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { getPhoto, storePhoto } from '~app/shared/photos.server';
import { getRecipe } from '~app/shared/recipes.server';
import { defined } from '~testing/defined';
import { render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/EditRecipePageRoute';
import EditRecipePage, { action, loader } from './EditRecipePageRoute';

const addRecipe = (db: D1Database, slug: string, image: string | null = null) =>
  db.prepare("INSERT INTO recipes (slug, title, author, image) VALUES (?, 'Soep', 'Oma', ?)").bind(slug, image).run();

const contextWithDb = (db: D1Database, photos: R2Bucket) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  return context;
};

const load = (db: D1Database, photos: R2Bucket, slug: string) =>
  loader(fake<Route.LoaderArgs>({ params: { slug }, context: contextWithDb(db, photos) }));

const submit = (db: D1Database, photos: R2Bucket, slug: string, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      params: { slug },
      request: new Request(`http://localhost/recepten/${slug}/bewerken`, { method: 'POST', body: new URLSearchParams(fields) }),
      context: contextWithDb(db, photos),
    }),
  );

const status = async (run: Promise<unknown>) => {
  try {
    await run;
  } catch (e) {
    return (e as { init?: { status?: number } }).init?.status;
  }
};

describe('recipe-editing › Form shows the stored values', () => {
  test('the loader returns the stored values', async ({ db, photos }) => {
    await db
      .prepare(
        "INSERT INTO recipes (slug, title, author, time, servings, intro, image) VALUES ('volledig', 'Soep', 'Oma', '1u', 4, 'Warm', '/soep.jpg')",
      )
      .run();
    const { values } = await load(db, photos, 'volledig');
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
});

describe('recipe-ingredient-editing › Stored ingredients come back as lines', () => {
  test.beforeEach(async ({ db }) => {
    await db.batch([
      db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('lijst', 'Lijst', 'Oma')"),
      db.prepare("INSERT INTO ingredients (recipe_id, position, name, quantity_text) SELECT id, 1, 'zout', '' FROM recipes WHERE slug = 'lijst'"),
      db.prepare(
        "INSERT INTO ingredients (recipe_id, position, name, quantity_text) SELECT id, 0, 'bloem', '250 g' FROM recipes WHERE slug = 'lijst'",
      ),
    ]);
  });

  test('the lines follow the stored order', async ({ db, photos }) => {
    assert.deepEqual((await load(db, photos, 'lijst')).values.ingredients, ['250 g bloem', 'zout']);
  });
});

describe('recipe-editing › Unknown recipe', () => {
  test('loading answers 404', async ({ db, photos }) => {
    assert.equal(await status(load(db, photos, 'nope')), 404);
  });

  test('saving answers 404', async ({ db, photos }) => {
    assert.equal(await status(submit(db, photos, 'nope', { title: 'X', author: 'Y' })), 404);
  });
});

describe('recipe-editing › Invalid edit is refused', () => {
  let res: { init?: { status?: number }; data: { errors: object } };

  test.beforeEach(async ({ db, photos }) => {
    await addRecipe(db, 'ongeldig');
    res = (await submit(db, photos, 'ongeldig', { title: '', author: 'Oma' })) as typeof res;
  });

  test('the answer is 400', () => {
    assert.equal(res.init?.status, 400);
  });

  test('the errors name the title', () => {
    assert.deepEqual(Object.keys(res.data.errors), ['title']);
  });

  test('the stored recipe is unchanged', async ({ db }) => {
    assert.equal((await getRecipe(db, 'ongeldig'))?.title, 'Soep');
  });
});

describe('the edit route', () => {
  let res: Response;

  test.beforeEach(async ({ db, photos }) => {
    await addRecipe(db, 'bewerkt');
    res = (await submit(db, photos, 'bewerkt', { title: 'Tomatensoep', author: 'Oma', servings: '' })) as Response;
  });

  test('goes back to the recipe after saving', () => {
    assert.equal(res.headers.get('Location'), '/recepten/bewerkt');
  });

  test('saves the edit', async ({ db }) => {
    const r = await getRecipe(db, 'bewerkt');
    assert.deepEqual([r?.title, r?.servings], ['Tomatensoep', null]);
  });
});

const upload = async (photos: R2Bucket) => {
  const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
  assert.ok('path' in stored);
  return stored.path;
};
const isStored = async (photos: R2Bucket, path: string) => (await getPhoto(photos, path.slice('/foto/'.length))) !== null;

describe('recipe-photo › Replaced photo is deleted', () => {
  let old: string;
  let next: string;

  test.beforeEach(async ({ db, photos }) => {
    [old, next] = [await upload(photos), await upload(photos)];
    await addRecipe(db, 'vervangen', old);
    await submit(db, photos, 'vervangen', { title: 'T', author: 'Oma', image: next });
  });

  test('the recipe gets the new photo', async ({ db }) => {
    assert.equal((await getRecipe(db, 'vervangen'))?.image, next);
  });

  test('the old photo is deleted', async ({ photos }) => {
    assert.equal(await isStored(photos, old), false);
  });

  test('the new photo is kept', async ({ photos }) => {
    assert.equal(await isStored(photos, next), true);
  });

  // Removing the photo deletes it too
  test('removing the photo clears the recipe image', async ({ db, photos }) => {
    await submit(db, photos, 'vervangen', { title: 'T', author: 'Oma', image: '' });
    assert.equal((await getRecipe(db, 'vervangen'))?.image, null);
  });

  test('removing the photo deletes it', async ({ db, photos }) => {
    await submit(db, photos, 'vervangen', { title: 'T', author: 'Oma', image: '' });
    assert.equal(await isStored(photos, next), false);
  });
});

describe('recipe-photo › Non-upload images are never deleted', () => {
  test.beforeEach(async ({ db, photos }) => {
    await addRecipe(db, 'voorbeeld', '/img/appeltaart.jpg');
    await photos.put('photos/other', 'x');
    await submit(db, photos, 'voorbeeld', { title: 'T', author: 'Oma', image: await upload(photos) });
  });

  test('a foreign file is not deleted', async ({ photos }) => {
    assert.equal(
      (await photos.list()).objects.some((o) => o.key === 'photos/other'),
      true,
    );
  });

  // An unchanged upload is kept
  test('an unchanged upload is kept', async ({ db, photos }) => {
    const kept = await upload(photos);
    await addRecipe(db, 'houdt', kept);
    await submit(db, photos, 'houdt', { title: 'T2', author: 'Oma', image: kept });
    assert.equal(await isStored(photos, kept), true);
  });
});

describe('image links on save', () => {
  test('a forged external image link is dropped', async ({ db, photos }) => {
    await addRecipe(db, 'vals', null);
    await submit(db, photos, 'vals', { title: 'T', author: 'Oma', image: 'https://evil.example/x.jpg' });
    assert.equal((await getRecipe(db, 'vals'))?.image, null);
  });

  test('a stored one is kept', async ({ db, photos }) => {
    await addRecipe(db, 'oud', '/img/oud.jpg');
    await submit(db, photos, 'oud', { title: 'T2', author: 'Oma', image: '/img/oud.jpg' });
    assert.equal((await getRecipe(db, 'oud'))?.image, '/img/oud.jpg');
  });
});

describe('the edit page', () => {
  const values = { title: 'Soep', author: 'Oma', servings: '4', time: '1u', intro: 'Warm', image: '', ingredients: [], steps: [] };
  const props = fake<Route.ComponentProps>({
    loaderData: { slug: 'soep', updatedAt: '2026-01-01T00:00:00Z', authors: ['Oma'], tile: 0, seal: undefined, values },
  });
  const show = () => render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <EditRecipePage {...props} /> }])} />);

  test('hands its heading to the editor', () => {
    show();
    assert.equal(screen.getByTestId('RecipeEditor-heading').textContent, 'Recept bewerken');
  });

  test('hands the stored values to the editor', () => {
    show();
    assert.equal(screen.getByTestId<HTMLInputElement>('RecipeEditor-title').value, 'Soep');
  });

  test('sends cancel back to the recipe', () => {
    show();
    assert.equal(screen.getByTestId('RecipeEditor-cancel').getAttribute('href'), '/recepten/soep');
  });
});

describe('an edit posting ingredient lines', () => {
  const ingredients = (...texts: string[]) => JSON.stringify(texts.map((text) => ({ text })));

  test('saves the lines', async ({ db, photos }) => {
    await addRecipe(db, 'regels');
    await submit(db, photos, 'regels', { title: 'Soep', author: 'Oma', ingredients: ingredients('250 g bloem', '', '2 grote uien') });
    assert.deepEqual((await getRecipe(db, 'regels'))?.ingredients, [
      { quantityText: '250 g', quantityValue: 250, quantityUnit: 'g', name: 'bloem' },
      { quantityText: '2', quantityValue: 2, quantityUnit: null, name: 'grote uien' },
    ]);
  });

  test('a bad row refuses it and names the row', async ({ db, photos }) => {
    await addRecipe(db, 'slechte-regel');
    const res = (await submit(db, photos, 'slechte-regel', { title: 'Soep', author: 'Oma', ingredients: ingredients('zout', '250 g') })) as {
      data: { errors: { ingredients: object } };
    };
    assert.deepEqual(Object.keys(res.data.errors.ingredients), ['1']);
  });

  test('a refused edit keeps the stored ingredients', async ({ db, photos }) => {
    await addRecipe(db, 'geweigerd');
    await submit(db, photos, 'geweigerd', { title: 'Soep', author: 'Oma', ingredients: ingredients('250 g bloem', 'zout') });
    await submit(db, photos, 'geweigerd', { title: 'Soep', author: 'Oma', ingredients: ingredients('zout', '250 g') });
    assert.equal((await getRecipe(db, 'geweigerd'))?.ingredients.length, 2);
  });
});

describe('an edit posted without an ingredients field', () => {
  test('keeps the stored ingredients', async ({ db, photos }) => {
    await addRecipe(db, 'zonder-regels');
    await submit(db, photos, 'zonder-regels', { title: 'Soep', author: 'Oma', ingredients: JSON.stringify([{ text: '2 uien' }]) });
    await submit(db, photos, 'zonder-regels', { title: 'Soep 2', author: 'Oma' });
    assert.deepEqual((await getRecipe(db, 'zonder-regels'))?.ingredients, [
      { quantityText: '2', quantityValue: 2, quantityUnit: null, name: 'uien' },
    ]);
  });
});

describe('recipe-step-editing › Stored steps come back in the editor', () => {
  test.beforeEach(async ({ db }) => {
    await db.batch([
      db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('stappen', 'Stappen', 'Oma')"),
      db.prepare("INSERT INTO steps (recipe_id, position, body) SELECT id, 1, 'bak' FROM recipes WHERE slug = 'stappen'"),
      db.prepare("INSERT INTO steps (recipe_id, position, body) SELECT id, 0, 'kneed' FROM recipes WHERE slug = 'stappen'"),
    ]);
  });

  test('the steps follow the stored order', async ({ db, photos }) => {
    assert.deepEqual(defined((await load(db, photos, 'stappen')).values.steps), [
      { body: 'kneed', ingredients: [] },
      { body: 'bak', ingredients: [] },
    ]);
  });
});

describe('an edit posting steps', () => {
  const steps = (...bodies: string[]) => JSON.stringify(bodies.map((body) => ({ body })));
  const bodiesOf = async (db: D1Database, slug: string) => (await getRecipe(db, slug))?.steps.map((s) => s.body);

  test('saves the steps without the empty ones', async ({ db, photos }) => {
    await addRecipe(db, 'stap-opslaan');
    await submit(db, photos, 'stap-opslaan', { title: 'Soep', author: 'Oma', steps: steps('snijd', '', 'kook\nzacht') });
    assert.deepEqual(await bodiesOf(db, 'stap-opslaan'), ['snijd', 'kook zacht']);
  });

  test('a submit without the field keeps them', async ({ db, photos }) => {
    await addRecipe(db, 'stap-houdt');
    await submit(db, photos, 'stap-houdt', { title: 'Soep', author: 'Oma', steps: steps('snijd', 'kook') });
    await submit(db, photos, 'stap-houdt', { title: 'Soep 2', author: 'Oma' });
    assert.deepEqual(await bodiesOf(db, 'stap-houdt'), ['snijd', 'kook']);
  });

  test('a refusal shows the posted steps again', async ({ db, photos }) => {
    await addRecipe(db, 'stap-weiger');
    const res = (await submit(db, photos, 'stap-weiger', { title: '', author: 'Oma', steps: steps('a', '', 'b') })) as {
      data: { values: { steps: { body: string }[] } };
    };
    assert.deepEqual(
      res.data.values.steps.map((s) => s.body),
      ['a', '', 'b'],
    );
  });

  test('a refusal keeps the stored steps', async ({ db, photos }) => {
    await addRecipe(db, 'stap-bewaard');
    await submit(db, photos, 'stap-bewaard', { title: 'Soep', author: 'Oma', steps: steps('snijd', 'kook') });
    await submit(db, photos, 'stap-bewaard', { title: '', author: 'Oma', steps: steps('a', 'b') });
    assert.deepEqual(await bodiesOf(db, 'stap-bewaard'), ['snijd', 'kook']);
  });
});

describe('a saved recipe with chips', () => {
  const posted = [
    {
      body: 'Zeef de bloem. Bak 30 minuten op 180 graden.',
      ingredients: [{ quantityText: '250 g', name: 'bloem' }],
      ovenTemperature: 180,
      timer: { minutes: 30, label: 'Bakken' },
    },
    { body: 'Serveer.', ingredients: [] },
  ];

  test('comes back in the editor with equal chips', async ({ db, photos }) => {
    await addRecipe(db, 'chips-terug');
    await submit(db, photos, 'chips-terug', { title: 'Soep', author: 'Oma', steps: JSON.stringify(posted) });
    assert.deepEqual(defined((await load(db, photos, 'chips-terug')).values.steps), posted);
  });

  test('a refusal shows the chips again', async ({ db, photos }) => {
    await addRecipe(db, 'chips-weiger');
    const refused = (await submit(db, photos, 'chips-weiger', { title: '', author: 'Oma', steps: JSON.stringify(posted) })) as unknown as {
      data: { values: { steps: unknown } };
    };
    assert.deepEqual(refused.data.values.steps, posted);
  });
});

describe('the edit loader', () => {
  test('returns when the recipe was last saved, for flagging a draft that started from an older version', async ({ db, photos }) => {
    await addRecipe(db, 'versie');
    assert.match((await load(db, photos, 'versie')).updatedAt, /^\d{4}-\d\d-\d\dT/);
  });
});
