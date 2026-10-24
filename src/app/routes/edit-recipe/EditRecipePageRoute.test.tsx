import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { beforeAll, describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { getPhoto, storePhoto } from '~app/shared/photos.server';
import { getRecipe } from '~app/shared/recipes.server';
import { test } from '~testing/db';
import { defined } from '~testing/defined';
import { render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import type { Route } from './+types/EditRecipePageRoute';
import EditRecipePage, { action, loader } from './EditRecipePageRoute';

// Real loader and action against an in-memory D1 holding a recipe the test inserted.
let db: D1Database;
let photos: R2Bucket;

test.beforeAll(async ({ testDb }) => {
  ({ db, photos } = testDb);
});

const addRecipe = (slug: string, image: string | null = null) =>
  db.prepare("INSERT INTO recipes (slug, title, author, image) VALUES (?, 'Soep', 'Oma', ?)").bind(slug, image).run();

const contextWithDb = () => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  return context;
};

const load = (slug: string) => loader(fake<Route.LoaderArgs>({ params: { slug }, context: contextWithDb() }));

const submit = (slug: string, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      params: { slug },
      request: new Request(`http://localhost/recepten/${slug}/bewerken`, { method: 'POST', body: new URLSearchParams(fields) }),
      context: contextWithDb(),
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
  test('the loader returns the stored values', async () => {
    await db
      .prepare(
        "INSERT INTO recipes (slug, title, author, time, servings, intro, image) VALUES ('volledig', 'Soep', 'Oma', '1u', 4, 'Warm', '/soep.jpg')",
      )
      .run();
    const { values } = await load('volledig');
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
  beforeAll(async () => {
    await db.batch([
      db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('lijst', 'Lijst', 'Oma')"),
      db.prepare("INSERT INTO ingredients (recipe_id, position, name, quantity_text) SELECT id, 1, 'zout', '' FROM recipes WHERE slug = 'lijst'"),
      db.prepare(
        "INSERT INTO ingredients (recipe_id, position, name, quantity_text) SELECT id, 0, 'bloem', '250 g' FROM recipes WHERE slug = 'lijst'",
      ),
    ]);
  });

  test('the lines follow the stored order', async () => {
    assert.deepEqual((await load('lijst')).values.ingredients, ['250 g bloem', 'zout']);
  });
});

describe('recipe-editing › Unknown recipe', () => {
  test('loading answers 404', async () => {
    assert.equal(await status(load('nope')), 404);
  });

  test('saving answers 404', async () => {
    assert.equal(await status(submit('nope', { title: 'X', author: 'Y' })), 404);
  });
});

describe('recipe-editing › Invalid edit is refused', () => {
  let res: { init?: { status?: number }; data: { errors: object } };

  beforeAll(async () => {
    await addRecipe('ongeldig');
    res = (await submit('ongeldig', { title: '', author: 'Oma' })) as typeof res;
  });

  test('the answer is 400', () => {
    assert.equal(res.init?.status, 400);
  });

  test('the errors name the title', () => {
    assert.deepEqual(Object.keys(res.data.errors), ['title']);
  });

  test('the stored recipe is unchanged', async () => {
    assert.equal((await getRecipe(db, 'ongeldig'))?.title, 'Soep');
  });
});

describe('the edit route', () => {
  let res: Response;

  beforeAll(async () => {
    await addRecipe('bewerkt');
    res = (await submit('bewerkt', { title: 'Tomatensoep', author: 'Oma', servings: '' })) as Response;
  });

  test('goes back to the recipe after saving', () => {
    assert.equal(res.headers.get('Location'), '/recepten/bewerkt');
  });

  test('saves the edit', async () => {
    const r = await getRecipe(db, 'bewerkt');
    assert.deepEqual([r?.title, r?.servings], ['Tomatensoep', null]);
  });
});

const upload = async () => {
  const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
  assert.ok('path' in stored);
  return stored.path;
};
const isStored = async (path: string) => (await getPhoto(photos, path.slice('/foto/'.length))) !== null;

describe('recipe-photo › Replaced photo is deleted', () => {
  let old: string;
  let next: string;

  beforeAll(async () => {
    [old, next] = [await upload(), await upload()];
    await addRecipe('vervangen', old);
    await submit('vervangen', { title: 'T', author: 'Oma', image: next });
  });

  test('the recipe gets the new photo', async () => {
    assert.equal((await getRecipe(db, 'vervangen'))?.image, next);
  });

  test('the old photo is deleted', async () => {
    assert.equal(await isStored(old), false);
  });

  test('the new photo is kept', async () => {
    assert.equal(await isStored(next), true);
  });

  // Removing the photo deletes it too
  test('removing the photo clears the recipe image', async () => {
    await submit('vervangen', { title: 'T', author: 'Oma', image: '' });
    assert.equal((await getRecipe(db, 'vervangen'))?.image, null);
  });

  test('removing the photo deletes it', async () => {
    assert.equal(await isStored(next), false);
  });
});

describe('recipe-photo › Non-upload images are never deleted', () => {
  beforeAll(async () => {
    await addRecipe('voorbeeld', '/img/appeltaart.jpg');
    await photos.put('photos/other', 'x');
    await submit('voorbeeld', { title: 'T', author: 'Oma', image: await upload() });
  });

  test('a foreign file is not deleted', async () => {
    assert.equal(
      (await photos.list()).objects.some((o) => o.key === 'photos/other'),
      true,
    );
  });

  // An unchanged upload is kept
  test('an unchanged upload is kept', async () => {
    const kept = await upload();
    await addRecipe('houdt', kept);
    await submit('houdt', { title: 'T2', author: 'Oma', image: kept });
    assert.equal(await isStored(kept), true);
  });
});

describe('image links on save', () => {
  test('a forged external image link is dropped', async () => {
    await addRecipe('vals', null);
    await submit('vals', { title: 'T', author: 'Oma', image: 'https://evil.example/x.jpg' });
    assert.equal((await getRecipe(db, 'vals'))?.image, null);
  });

  test('a stored one is kept', async () => {
    await addRecipe('oud', '/img/oud.jpg');
    await submit('oud', { title: 'T2', author: 'Oma', image: '/img/oud.jpg' });
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

  test('saves the lines', async () => {
    await addRecipe('regels');
    await submit('regels', { title: 'Soep', author: 'Oma', ingredients: ingredients('250 g bloem', '', '2 grote uien') });
    assert.deepEqual((await getRecipe(db, 'regels'))?.ingredients, [
      { quantityText: '250 g', name: 'bloem' },
      { quantityText: '2', name: 'grote uien' },
    ]);
  });

  test('a bad row refuses it and names the row', async () => {
    await addRecipe('slechte-regel');
    const res = (await submit('slechte-regel', { title: 'Soep', author: 'Oma', ingredients: ingredients('zout', '250 g') })) as {
      data: { errors: { ingredients: object } };
    };
    assert.deepEqual(Object.keys(res.data.errors.ingredients), ['1']);
  });

  test('a refused edit keeps the stored ingredients', async () => {
    await addRecipe('geweigerd');
    await submit('geweigerd', { title: 'Soep', author: 'Oma', ingredients: ingredients('250 g bloem', 'zout') });
    await submit('geweigerd', { title: 'Soep', author: 'Oma', ingredients: ingredients('zout', '250 g') });
    assert.equal((await getRecipe(db, 'geweigerd'))?.ingredients.length, 2);
  });
});

describe('an edit posted without an ingredients field', () => {
  test('keeps the stored ingredients', async () => {
    await addRecipe('zonder-regels');
    await submit('zonder-regels', { title: 'Soep', author: 'Oma', ingredients: JSON.stringify([{ text: '2 uien' }]) });
    await submit('zonder-regels', { title: 'Soep 2', author: 'Oma' });
    assert.deepEqual((await getRecipe(db, 'zonder-regels'))?.ingredients, [{ quantityText: '2', name: 'uien' }]);
  });
});

describe('recipe-step-editing › Stored steps come back in the editor', () => {
  beforeAll(async () => {
    await db.batch([
      db.prepare("INSERT INTO recipes (slug, title, author) VALUES ('stappen', 'Stappen', 'Oma')"),
      db.prepare("INSERT INTO steps (recipe_id, position, body) SELECT id, 1, 'bak' FROM recipes WHERE slug = 'stappen'"),
      db.prepare("INSERT INTO steps (recipe_id, position, body) SELECT id, 0, 'kneed' FROM recipes WHERE slug = 'stappen'"),
    ]);
  });

  test('the steps follow the stored order', async () => {
    assert.deepEqual(defined((await load('stappen')).values.steps), [
      { body: 'kneed', ingredients: [] },
      { body: 'bak', ingredients: [] },
    ]);
  });
});

describe('an edit posting steps', () => {
  const steps = (...bodies: string[]) => JSON.stringify(bodies.map((body) => ({ body })));
  const bodiesOf = async (slug: string) => (await getRecipe(db, slug))?.steps.map((s) => s.body);

  test('saves the steps without the empty ones', async () => {
    await addRecipe('stap-opslaan');
    await submit('stap-opslaan', { title: 'Soep', author: 'Oma', steps: steps('snijd', '', 'kook\nzacht') });
    assert.deepEqual(await bodiesOf('stap-opslaan'), ['snijd', 'kook zacht']);
  });

  test('a submit without the field keeps them', async () => {
    await addRecipe('stap-houdt');
    await submit('stap-houdt', { title: 'Soep', author: 'Oma', steps: steps('snijd', 'kook') });
    await submit('stap-houdt', { title: 'Soep 2', author: 'Oma' });
    assert.deepEqual(await bodiesOf('stap-houdt'), ['snijd', 'kook']);
  });

  test('a refusal shows the posted steps again', async () => {
    await addRecipe('stap-weiger');
    const res = (await submit('stap-weiger', { title: '', author: 'Oma', steps: steps('a', '', 'b') })) as {
      data: { values: { steps: { body: string }[] } };
    };
    assert.deepEqual(
      res.data.values.steps.map((s) => s.body),
      ['a', '', 'b'],
    );
  });

  test('a refusal keeps the stored steps', async () => {
    await addRecipe('stap-bewaard');
    await submit('stap-bewaard', { title: 'Soep', author: 'Oma', steps: steps('snijd', 'kook') });
    await submit('stap-bewaard', { title: '', author: 'Oma', steps: steps('a', 'b') });
    assert.deepEqual(await bodiesOf('stap-bewaard'), ['snijd', 'kook']);
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

  test('comes back in the editor with equal chips', async () => {
    await addRecipe('chips-terug');
    await submit('chips-terug', { title: 'Soep', author: 'Oma', steps: JSON.stringify(posted) });
    assert.deepEqual(defined((await load('chips-terug')).values.steps), posted);
  });

  test('a refusal shows the chips again', async () => {
    await addRecipe('chips-weiger');
    const refused = (await submit('chips-weiger', { title: '', author: 'Oma', steps: JSON.stringify(posted) })) as unknown as {
      data: { values: { steps: unknown } };
    };
    assert.deepEqual(refused.data.values.steps, posted);
  });
});

describe('the edit loader', () => {
  test('returns when the recipe was last saved, for flagging a draft that started from an older version', async () => {
    await addRecipe('versie');
    assert.match((await load('versie')).updatedAt, /^\d{4}-\d\d-\d\dT/);
  });
});
