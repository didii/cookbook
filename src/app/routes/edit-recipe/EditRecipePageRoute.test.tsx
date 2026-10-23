import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { envContext } from '~app/shared/context.server';
import { getPhoto, storePhoto } from '~app/shared/photos.server';
import { getRecipe } from '~app/shared/recipes.server';
import { createTestDb } from '~testing/db';
import { defined } from '~testing/defined';
import { render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import type { Route } from './+types/EditRecipePageRoute';
import type { Route as NewRoute } from './+types/NewRecipePageRoute';
import EditRecipePage, { action, loader } from './EditRecipePageRoute';
import NewRecipePage from './NewRecipePageRoute';

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
});

describe('recipe-ingredient-editing › Stored ingredients come back as lines', () => {
  before(async () => {
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

  before(async () => {
    res = (await submit('soep', { title: '', author: 'Oma' })) as typeof res;
  });

  test('the answer is 400', () => {
    assert.equal(res.init?.status, 400);
  });

  test('the errors name the title', () => {
    assert.deepEqual(Object.keys(res.data.errors), ['title']);
  });

  test('the stored recipe is unchanged', async () => {
    assert.equal((await getRecipe(db, 'soep'))?.title, 'Soep');
  });
});

describe('the edit route', () => {
  let res: Response;

  before(async () => {
    res = (await submit('soep', { title: 'Tomatensoep', author: 'Oma', servings: '' })) as Response;
  });

  test('goes back to the recipe after saving', () => {
    assert.equal(res.headers.get('Location'), '/recepten/soep');
  });

  test('saves the edit', async () => {
    const r = await getRecipe(db, 'soep');
    assert.deepEqual([r?.title, r?.servings], ['Tomatensoep', null]);
  });
});

const upload = async () => {
  const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer);
  assert.ok('path' in stored);
  return stored.path;
};
const isStored = async (path: string) => (await getPhoto(photos, path.slice('/foto/'.length))) !== null;
const addRecipe = (slug: string, image: string | null) =>
  db.prepare("INSERT INTO recipes (slug, title, author, image) VALUES (?, 'T', 'Oma', ?)").bind(slug, image).run();

describe('recipe-photo › Replaced photo is deleted', () => {
  let old: string;
  let next: string;

  before(async () => {
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
  before(async () => {
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

// Both routes render the shared editor and write no fields of their own, so the form can only differ in values, heading and cancel target.
describe('recipe-editing › Same form for new and existing recipes', () => {
  const values = { title: 'Soep', author: 'Oma', servings: '4', time: '1u', intro: 'Warm', image: '', ingredients: [], steps: [] };
  const form = (element: ReactElement) => {
    const router = createMemoryRouter([{ path: '/', element }]);
    const { container, unmount } = render(<RouterProvider router={router} />);
    const found = {
      heading: screen.getByTestId('RecipeEditor-heading').textContent,
      headingTag: screen.getByTestId('RecipeEditor-heading').tagName,
      titleLabel: screen.getByTestId<HTMLInputElement>('RecipeEditor-title').labels?.[0]?.textContent,
      title: screen.getByTestId<HTMLInputElement>('RecipeEditor-title').value,
      controls: [...container.querySelectorAll('form [name]')].map((el) => el.getAttribute('name')).sort(),
      cancel: screen.getByTestId('RecipeEditor-cancel').getAttribute('href'),
    };
    unmount();
    return found;
  };
  const editProps = fake<Route.ComponentProps>({
    loaderData: { slug: 'soep', updatedAt: '2026-01-01T00:00:00Z', authors: ['Oma'], tile: 0, seal: undefined, values },
  });
  const newProps = fake<NewRoute.ComponentProps>({ loaderData: { authors: ['Oma'], tile: 0, seal: undefined } });
  const edit = () => form(<EditRecipePage {...editProps} />);
  const create = () => form(<NewRecipePage {...newProps} />);

  // The same fields, in the same form.
  test('both forms have the same fields', () => {
    assert.deepEqual(edit().controls, create().controls);
  });

  // Only the starting values, the heading and the way back differ.
  test('the edit form has its own heading, values and way back', () => {
    const f = edit();
    assert.deepEqual([f.heading, f.title, f.cancel], ['Recept bewerken', 'Soep', '/recepten/soep']);
  });

  test('the new form has its own heading, values and way back', () => {
    const f = create();
    assert.deepEqual([f.heading, f.title, f.cancel], ['Nieuw recept', '', '/']);
  });

  for (const [name, get] of [
    ['edit', edit],
    ['new', create],
  ] as const) {
    test(`the ${name} form has an h1 heading`, () => {
      assert.equal(get().headingTag, 'H1');
    });

    test(`the ${name} form has a title label`, () => {
      assert.match(get().titleLabel ?? '', /Titel/);
    });
  }
});

describe('an edit posting ingredient lines', () => {
  const ingredients = (...texts: string[]) => JSON.stringify(texts.map((text) => ({ text })));

  test('saves the lines', async () => {
    await submit('soep', { title: 'Soep', author: 'Oma', ingredients: ingredients('250 g bloem', '', '2 grote uien') });
    assert.deepEqual((await getRecipe(db, 'soep'))?.ingredients, [
      { quantityText: '250 g', name: 'bloem' },
      { quantityText: '2', name: 'grote uien' },
    ]);
  });

  test('a bad row refuses it and names the row', async () => {
    const res = (await submit('soep', { title: 'Soep', author: 'Oma', ingredients: ingredients('zout', '250 g') })) as {
      data: { errors: { ingredients: object } };
    };
    assert.deepEqual(Object.keys(res.data.errors.ingredients), ['1']);
  });

  test('a refused edit keeps the stored ingredients', async () => {
    assert.equal((await getRecipe(db, 'soep'))?.ingredients.length, 2);
  });
});

describe('an edit posted without an ingredients field', () => {
  test('keeps the stored ingredients', async () => {
    await submit('soep', { title: 'Soep', author: 'Oma', ingredients: JSON.stringify([{ text: '2 uien' }]) });
    await submit('soep', { title: 'Soep 2', author: 'Oma' });
    assert.deepEqual((await getRecipe(db, 'soep'))?.ingredients, [{ quantityText: '2', name: 'uien' }]);
  });
});

describe('recipe-step-editing › Stored steps come back in the editor', () => {
  before(async () => {
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
  const bodiesOf = async () => (await getRecipe(db, 'soep'))?.steps.map((s) => s.body);

  test('saves the steps without the empty ones', async () => {
    await submit('soep', { title: 'Soep', author: 'Oma', steps: steps('snijd', '', 'kook\nzacht') });
    assert.deepEqual(await bodiesOf(), ['snijd', 'kook zacht']);
  });

  test('a submit without the field keeps them', async () => {
    await submit('soep', { title: 'Soep 2', author: 'Oma' });
    assert.deepEqual(await bodiesOf(), ['snijd', 'kook zacht']);
  });

  test('a refusal shows the posted steps again', async () => {
    const res = (await submit('soep', { title: '', author: 'Oma', steps: steps('a', '', 'b') })) as {
      data: { values: { steps: { body: string }[] } };
    };
    assert.deepEqual(
      res.data.values.steps.map((s) => s.body),
      ['a', '', 'b'],
    );
  });

  test('a refusal keeps the stored steps', async () => {
    assert.deepEqual(await bodiesOf(), ['snijd', 'kook zacht']);
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
    await submit('soep', { title: 'Soep', author: 'Oma', steps: JSON.stringify(posted) });
    assert.deepEqual(defined((await load('soep')).values.steps), posted);
  });

  test('a refusal shows the chips again', async () => {
    const refused = (await submit('soep', { title: '', author: 'Oma', steps: JSON.stringify(posted) })) as unknown as {
      data: { values: { steps: unknown } };
    };
    assert.deepEqual(refused.data.values.steps, posted);
  });
});

describe('the edit loader', () => {
  test('returns when the recipe was last saved, for flagging a draft that started from an older version', async () => {
    assert.match((await load('soep')).updatedAt, /^\d{4}-\d\d-\d\dT/);
  });
});
