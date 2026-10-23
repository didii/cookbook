import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { beforeAll, describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getRecipe } from '~app/shared/recipes.server';
import { createUser } from '~app/shared/users.server';
import { test } from '~testing/db';
import { cleanup, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import type { Route } from './+types/NewRecipePageRoute';
import { emptyDraftSeed } from './lib/draft';
import NewRecipePage, { action, loader } from './NewRecipePageRoute';

// Action-level tests: real action, real queries against an in-memory D1.
let db: D1Database;

test.beforeAll(({ testDb }) => {
  ({ db } = testDb);
});

const submit = (fields: Record<string, string>) => {
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

  beforeAll(async () => {
    res = (await submit({ title: ' Soep ', author: 'Oma', servings: '4' })) as Response;
  });

  test('the answer is a redirect', () => {
    assert.equal(res.status, 302);
  });

  test('the redirect goes to the new recipe', () => {
    assert.equal(res.headers.get('Location'), '/recepten/soep');
  });

  test('the title, author and servings are stored', async () => {
    const r = await getRecipe(db, 'soep');
    assert.deepEqual([r?.title, r?.author, r?.servings], ['Soep', 'Oma', 4]);
  });

  test('the creator is stored', async () => {
    assert.equal((await db.prepare("SELECT created_by FROM recipes WHERE slug = 'soep'").first())?.created_by, 'oma@example.com');
  });
});

describe('recipe-creation › Time, intro and image are stored', () => {
  test('the time, intro and image are stored', async () => {
    const image = '/foto/00000000-0000-4000-8000-000000000000.webp';
    await submit({ title: 'Compleet', author: 'Oma', time: ' 45 min ', intro: 'Lekker', image });
    const r = await getRecipe(db, 'compleet');
    assert.deepEqual([r?.time, r?.intro, r?.image], ['45 min', 'Lekker', image]);
  });
});

describe('recipe-creation › Servings left empty', () => {
  let res: Response;

  beforeAll(async () => {
    res = (await submit({ title: 'Zonder porties', author: 'Oma', servings: '' })) as Response;
  });

  test('the recipe is created', () => {
    assert.equal(res.headers.get('Location'), '/recepten/zonder-porties');
  });

  test('the servings are empty', async () => {
    assert.equal((await getRecipe(db, 'zonder-porties'))?.servings, null);
  });
});

/** The new recipe page as the router shows it, with what a refused submit hands back (nothing on first opening). */
const form = (actionData?: { errors: Record<string, string>; values: typeof emptyDraftSeed }) => {
  const props = fake<Route.ComponentProps>({ loaderData: { callingName: '', authors: ['Oma', 'Mama'], tile: 0, seal: undefined }, actionData });
  return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <NewRecipePage {...props} /> }])} />);
};

describe('recipe-creation › Suggestions ignore letter case', () => {
  test('lower case typing finds the capitalised author', async () => {
    form();
    const author = screen.getByTestId('AuthorInput-field');
    openAutocomplete(author);
    fireEvent.change(author, { target: { value: 'oma' } });
    const options = await screen.findAllByTestId('AuthorInput-option');
    assert.deepEqual(
      options.map((o) => o.textContent),
      ['Oma'],
    );
  });
});

describe('recipe-creation › Required fields are marked', () => {
  const label = (id: string) => document.querySelector(`label[for=${id}]`)!.textContent;

  // The title and author labels carry an asterisk and the form explains it; the servings label has none.
  test('the title label carries an asterisk', () => {
    form();
    assert.match(label('title') ?? '', /\*$/);
  });

  test('the author label carries an asterisk', () => {
    form();
    assert.match(label('author') ?? '', /\*$/);
  });

  test('the servings label has none', () => {
    form();
    assert.doesNotMatch(label('servings') ?? '', /\*/);
  });

  test('the form explains the asterisk', () => {
    form();
    assert.ok(screen.getByTestId('RecipeEditor-required').textContent?.includes('*'));
  });
});

describe('recipe-creation › Errors are announced and focused', () => {
  const errors = { title: 'Vul een titel in.', author: 'Vul een kok in.' };

  // Each error is text tied to its field, and focus is on the first field in error.
  for (const [id, message] of Object.entries(errors)) {
    test(`the ${id} field is marked invalid`, () => {
      form({ errors, values: emptyDraftSeed });
      assert.equal(document.getElementById(id)!.getAttribute('aria-invalid'), 'true');
    });

    test(`the ${id} field is described by its error`, () => {
      form({ errors, values: emptyDraftSeed });
      const field = document.getElementById(id)!;
      assert.equal(document.getElementById(field.getAttribute('aria-describedby')!)?.textContent, message);
    });
  }

  test('focus is on the first field in error', () => {
    form({ errors, values: emptyDraftSeed });
    assert.ok(document.activeElement === document.getElementById('title'));
  });

  // With only a later field in error, focus goes there.
  test('focus goes to a later field when only that one is in error', () => {
    form({ errors: { servings: 'Vul een getal in.' }, values: emptyDraftSeed });
    assert.ok(document.activeElement === document.getElementById('servings'));
  });
});

// Only the action stores anything: opening the editor (the loader) leaves the database as it was.
describe('recipe-form › Nothing stored before saving', () => {
  test('opening the editor leaves the database as it was', async () => {
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
  test('stores its non-blank steps in order', async () => {
    await submit({ title: 'Met stappen', author: 'Oma', steps: JSON.stringify([{ body: 'een' }, { body: '' }, { body: 'twee' }]) });
    assert.deepEqual(
      (await getRecipe(db, 'met-stappen'))?.steps.map((s) => s.body),
      ['een', 'twee'],
    );
  });
});

const openFormAs = async (email: string) => {
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
  test('the author field holds the calling name', async () => {
    await createUser(db, 'jos@example.com', 'Jos');
    await openFormAs('jos@example.com');
    assert.equal((document.getElementById('author') as HTMLInputElement).value, 'Jos');
  });
});

describe('recipe-creation › Prefilled author can be changed', () => {
  test('the changed author is stored', async () => {
    await createUser(db, 'jos2@example.com', 'Jos');
    await openFormAs('jos2@example.com');
    const author = document.getElementById('author') as HTMLInputElement;
    fireEvent.change(author, { target: { value: 'Oma' } });
    fireEvent.change(document.getElementById('title')!, { target: { value: 'Oma kookt' } });
    // Submit what the form itself posts, not values copied from the inputs.
    const posted = Object.fromEntries(
      [...author.form!.elements].filter((e): e is HTMLInputElement => e instanceof HTMLInputElement && !!e.name).map((e) => [e.name, e.value]),
    );
    await submit(posted);
    assert.equal((await getRecipe(db, 'oma-kookt'))?.author, 'Oma');
  });
});

describe('recipe-creation › Prefill alone is not a draft', () => {
  test('nothing is kept on the device', async () => {
    await createUser(db, 'jos3@example.com', 'Jos');
    await openFormAs('jos3@example.com');
    cleanup();
    assert.equal(window.localStorage.length, 0);
  });
});
