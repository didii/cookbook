import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { cleanup, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { getRecipe } from '~/.server/recipes';
import { createUser } from '~/.server/users';
import { emptyDraftSeed } from '~/lib/draft';
import type { Route } from './+types/route';
import NewRecipe, { action, loader } from './route';

// Action-level tests: real action, real queries against an in-memory D1.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

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

test('recipe-creation › Recipe is created', async () => {
  const res = (await submit({ title: ' Soep ', author: 'Oma', servings: '4' })) as Response;
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/recepten/soep');
  const r = await getRecipe(db, 'soep');
  assert.deepEqual([r?.title, r?.author, r?.servings], ['Soep', 'Oma', 4]);
  assert.equal((await db.prepare("SELECT created_by FROM recipes WHERE slug = 'soep'").first())?.created_by, 'oma@example.com');
});

test('recipe-creation › Time, intro and image are stored', async () => {
  const image = '/foto/00000000-0000-4000-8000-000000000000.webp';
  await submit({ title: 'Compleet', author: 'Oma', time: ' 45 min ', intro: 'Lekker', image });
  const r = await getRecipe(db, 'compleet');
  assert.deepEqual([r?.time, r?.intro, r?.image], ['45 min', 'Lekker', image]);
});

test('recipe-creation › Servings left empty', async () => {
  const res = (await submit({ title: 'Zonder porties', author: 'Oma', servings: '' })) as Response;
  assert.equal(res.headers.get('Location'), '/recepten/zonder-porties');
  assert.equal((await getRecipe(db, 'zonder-porties'))?.servings, null);
});

/** The new recipe page as the router shows it, with what a refused submit hands back (nothing on first opening). */
const form = (actionData?: { errors: Record<string, string>; values: typeof emptyDraftSeed }) => {
  const props = fake<Route.ComponentProps>({ loaderData: { callingName: '', authors: ['Oma', 'Mama'], tile: 0, seal: undefined }, actionData });
  return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <NewRecipe {...props} /> }])} />);
};

test('recipe-creation › Suggestions ignore letter case', async () => {
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

test('recipe-creation › Required fields are marked', () => {
  form();
  const label = (id: string) => document.querySelector(`label[for=${id}]`)!.textContent;
  // The title and author labels carry an asterisk and the form explains it; the servings label has none.
  assert.match(label('title') ?? '', /\*$/);
  assert.match(label('author') ?? '', /\*$/);
  assert.doesNotMatch(label('servings') ?? '', /\*/);
  assert.ok(screen.getByTestId('RecipeEditor-required').textContent?.includes('*'));
});

test('recipe-creation › Errors are announced and focused', () => {
  const errors = { title: 'Vul een titel in.', author: 'Vul een kok in.' };
  form({ errors, values: emptyDraftSeed });
  // Each error is text tied to its field, and focus is on the first field in error.
  for (const [id, message] of Object.entries(errors)) {
    const field = document.getElementById(id)!;
    assert.equal(field.getAttribute('aria-invalid'), 'true');
    assert.equal(document.getElementById(field.getAttribute('aria-describedby')!)?.textContent, message);
  }
  assert.ok(document.activeElement === document.getElementById('title'), 'focus on the title');
  cleanup();
  // With only a later field in error, focus goes there.
  form({ errors: { servings: 'Vul een getal in.' }, values: emptyDraftSeed });
  assert.ok(document.activeElement === document.getElementById('servings'), 'focus on the servings');
});

// Only the action stores anything: opening the editor (the loader) leaves the database as it was.
test('recipe-form › Nothing stored before saving', async () => {
  const count = async () => (await db.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>())?.n;
  const before = await count();
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, 'oma@example.com');
  await loader(fake<Route.LoaderArgs>({ context }));
  assert.equal(await count(), before);
});

test('a new recipe stores its non-blank steps in order', async () => {
  await submit({ title: 'Met stappen', author: 'Oma', steps: JSON.stringify([{ body: 'een' }, { body: '' }, { body: 'twee' }]) });
  assert.deepEqual(
    (await getRecipe(db, 'met-stappen'))?.steps.map((s) => s.body),
    ['een', 'twee'],
  );
});

const openFormAs = async (email: string) => {
  cleanup();
  window.localStorage.clear();
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  const loaderData = await loader(fake<Route.LoaderArgs>({ context }));
  const props = fake<Route.ComponentProps>({ loaderData });
  return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <NewRecipe {...props} /> }])} />);
};

test('recipe-creation › Author is prefilled', async () => {
  await createUser(db, 'jos@example.com', 'Jos');
  await openFormAs('jos@example.com');
  assert.equal((document.getElementById('author') as HTMLInputElement).value, 'Jos');
});

test('recipe-creation › Prefilled author can be changed', async () => {
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

test('recipe-creation › Prefill alone is not a draft', async () => {
  await createUser(db, 'jos3@example.com', 'Jos');
  await openFormAs('jos3@example.com');
  cleanup();
  assert.equal(window.localStorage.length, 0);
});
