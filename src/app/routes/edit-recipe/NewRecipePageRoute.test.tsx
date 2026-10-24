import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getRecipe } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { cleanup, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/NewRecipePageRoute';
import { emptyDraftSeed } from './lib/draft';
import NewRecipePage, { action, loader } from './NewRecipePageRoute';

const submit = (db: D1Database, fields: Record<string, string>) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
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

/** The new recipe page as the router shows it, with what a refused submit hands back (nothing on first opening). */
const form = (actionData?: { errors: Record<string, string>; values: typeof emptyDraftSeed }) => {
  const props = fake<Route.ComponentProps>({ loaderData: { callingName: '', authors: ['Oma', 'Mama'], tile: 0, seal: undefined }, actionData });
  return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <NewRecipePage {...props} /> }])} />);
};

describe('the new recipe page', () => {
  test.beforeEach(() => window.localStorage.clear());

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
    await loader(fake<Route.LoaderArgs>({ context }));
    assert.equal(await count(), rowsBefore);
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
  window.localStorage.clear();
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  const loaderData = await loader(fake<Route.LoaderArgs>({ context }));
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
