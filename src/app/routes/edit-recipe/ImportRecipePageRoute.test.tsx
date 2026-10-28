import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { describe, vi } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getRecipe } from '~app/shared/recipes.server';
import { render } from '~testing/dom';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/ImportRecipePageRoute';
import type { Route as NewRoute } from './+types/NewRecipePageRoute';
import ImportRecipePage, { action, loader } from './ImportRecipePageRoute';
import * as newRecipe from './NewRecipePageRoute';

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

const submit = (db: D1Database, fields: Record<string, string>) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, 'oma@example.com');
  return action(
    fake<NewRoute.ActionArgs>({
      request: new Request('http://localhost/recepten/importeren', { method: 'POST', body: new URLSearchParams(fields) }),
      context,
    }),
  );
};

describe('recipe-import › Import page saves like a new recipe', () => {
  test('a valid form is stored as a new recipe', async ({ db }) => {
    const res = (await submit(db, { title: 'Soep', author: 'Oma', source: 'https://example.com/soep' })) as Response;
    assert.equal(res.headers.get('Location'), '/recepten/soep');
    assert.equal((await getRecipe(db, 'soep'))?.source, 'https://example.com/soep');
  });

  test('the same checks apply: a form without a title is refused', async ({ db }) => {
    const res = (await submit(db, { author: 'Oma' })) as { init?: { status?: number } };
    assert.equal(res.init?.status, 400);
  });

  test('it is the action and loader of the new recipe page', () => {
    assert.equal(action, newRecipe.action);
    assert.equal(loader, newRecipe.loader);
  });
});

describe('the import page', () => {
  const show = () => {
    const props = fake<Route.ComponentProps>({ loaderData: { callingName: '', authors: [], tags: [], tile: 0, seal: undefined } });
    render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <ImportRecipePage {...props} /> }])} />);
  };

  test('offers the import option', () => {
    show();
    assert.equal(spy.props?.canImport, true);
  });

  test('has its own heading', () => {
    show();
    assert.equal(spy.props?.heading, 'Recept importeren');
  });
});
