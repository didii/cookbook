import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, test, vi } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { render } from '~testing/dom';
import { emptyDraftSeed } from './draft';
import { NewRecipeForm } from './NewRecipeForm';
import type { RecipeEditor } from './RecipeEditor';

// The editor has its own tests; here it records the props the form gives it.
const spy = vi.hoisted(() => ({ props: undefined as ComponentProps<typeof RecipeEditor> | undefined }));
vi.mock('./RecipeEditor', () => ({
  RecipeEditor: (props: ComponentProps<typeof RecipeEditor>) => {
    spy.props = props;
    return null;
  },
}));

const seed = { ...emptyDraftSeed, title: 'Soep', author: 'Jos' };
const loaderData = { seed, authors: ['Oma'], tags: ['Soep'], tagCategories: { Soep: 'Gang' }, tile: 2, seal: 'jia-wei' };
const show = (props: Partial<ComponentProps<typeof NewRecipeForm>> = {}) =>
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '/', element: <NewRecipeForm loaderData={loaderData} heading="Nieuw recept" {...props} /> }])}
    />,
  );
const editor = () => {
  assert.ok(spy.props);
  return spy.props;
};

beforeEach(() => {
  spy.props = undefined;
});

describe('NewRecipeForm', () => {
  test('starts with the seed of the loader', () => {
    show();
    assert.equal(editor().initial, seed);
  });

  test('shows the starting values when nothing was refused', () => {
    show();
    assert.equal(editor().values, editor().initial);
    assert.deepEqual(editor().errors, {});
  });

  test('shows the values and errors of a refused submit', () => {
    const values = { ...emptyDraftSeed, title: 'Soep' };
    show({ actionData: { values, errors: { author: 'Vul een kok in.' } } });
    assert.equal(editor().values, values);
    assert.deepEqual(editor().errors, { author: 'Vul een kok in.' });
  });

  test('hands the loaded lists, tile and seal on', () => {
    show();
    const { authors, tags, tagCategories, tile, seal } = editor();
    assert.deepEqual(
      { authors, tags, tagCategories, tile, seal },
      { authors: ['Oma'], tags: ['Soep'], tagCategories: { Soep: 'Gang' }, tile: 2, seal: 'jia-wei' },
    );
  });

  test('hands the heading on and cancels to the home page', () => {
    show({ heading: 'Recept importeren' });
    assert.equal(editor().heading, 'Recept importeren');
    assert.equal(editor().cancelTo, '/');
  });

  test('offers no import unless asked', () => {
    show();
    assert.ok(!editor().canImport);
  });

  test('hands the import option on', () => {
    show({ canImport: true });
    assert.equal(editor().canImport, true);
  });

  test('uses the default rules when the root loader has none', () => {
    show();
    assert.equal(editor().rules, defaultRules);
  });
});
