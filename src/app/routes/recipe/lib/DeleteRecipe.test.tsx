import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { defaultRules } from '~app/shared/rules';
import { fireEvent, precedes, render, screen, within } from '~testing/dom';
import { RecipeView } from './RecipeView';

const recipe = {
  id: 1,
  slug: 'appeltaart',
  updated_at: '2026-01-01T00:00:00Z',
  title: 'Appeltaart',
  author: 'Oma',
  time: null,
  servings: null,
  intro: 'Zoet',
  image: null,
  seal: null,
  ingredients: [],
};

// The delete form is a data-router `Form`, so the page needs a data router around it.
const show = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { path: '/', element: <RecipeView recipe={recipe} tile={0} steps={[{ body: 'bakken', ingredients: [] }]} rules={defaultRules} /> },
      ])}
    />,
  );
const trigger = () => screen.getByTestId('DeleteRecipe-open');
const dialog = () => document.querySelector('dialog')!;
/** Opens the popup. Happy-dom has no real modal, so `open` is what the tests look at. */
const open = () => {
  show();
  fireEvent.click(trigger());
};

test('recipe-deletion › Delete button is shown', () => {
  show();
  assert.ok(precedes(screen.getByTestId('StepItem-body'), trigger()));
  assert.equal(trigger().closest('header'), null);
});

test('recipe-deletion › Popup asks for confirmation', () => {
  show();
  assert.equal(dialog().open, false);
  fireEvent.click(trigger());
  assert.equal(dialog().open, true);
  const popup = within(dialog());
  assert.ok(popup.getByTestId('DeleteRecipe-title').textContent?.includes('Appeltaart'));
  assert.ok(popup.getByTestId('DeleteRecipe-confirm') && popup.getByTestId('DeleteRecipe-cancel'));
  assert.equal(popup.getByTestId('DeleteRecipe-confirm').getAttribute('type'), 'submit');
});

test('recipe-deletion › Cancel closes the popup', () => {
  open();
  fireEvent.click(within(dialog()).getByTestId('DeleteRecipe-cancel'));
  assert.equal(dialog().open, false);
});

test('recipe-deletion › Click outside closes the popup', () => {
  open();
  // A click inside the popup leaves it open; one on the backdrop (the dialog element itself) closes it.
  fireEvent.click(within(dialog()).getByTestId('DeleteRecipe-title'));
  assert.equal(dialog().open, true);
  // The padding belongs to the inner form, so a click on it is not a click on the backdrop.
  fireEvent.click(dialog().firstElementChild!);
  assert.equal(dialog().open, true);
  fireEvent.click(dialog());
  assert.equal(dialog().open, false);
});

// Escape and the focus trap come from the browser's modal dialog, which happy-dom does not implement.
test.todo('recipe-deletion › Escape closes the popup');
