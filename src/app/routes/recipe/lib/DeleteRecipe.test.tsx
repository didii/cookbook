import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
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

describe('recipe-deletion › Delete button is shown', () => {
  test('the button comes after the steps', () => {
    show();
    assert.ok(precedes(screen.getByTestId('StepItem-body'), trigger()));
  });

  test('the button is not in the header', () => {
    show();
    assert.equal(trigger().closest('header'), null);
  });
});

describe('recipe-deletion › Popup asks for confirmation', () => {
  test('the popup is closed at first', () => {
    show();
    assert.equal(dialog().open, false);
  });

  test('pressing the button opens it', () => {
    open();
    assert.equal(dialog().open, true);
  });

  test('it names the recipe', () => {
    open();
    assert.ok(within(dialog()).getByTestId('DeleteRecipe-title').textContent?.includes('Appeltaart'));
  });

  test('it has a confirm and a cancel button', () => {
    open();
    const popup = within(dialog());
    assert.ok(popup.getByTestId('DeleteRecipe-confirm') && popup.getByTestId('DeleteRecipe-cancel'));
  });

  test('the confirm button submits the form', () => {
    open();
    assert.equal(within(dialog()).getByTestId('DeleteRecipe-confirm').getAttribute('type'), 'submit');
  });
});

describe('recipe-deletion › Cancel closes the popup', () => {
  test('the popup is closed after cancel', () => {
    open();
    fireEvent.click(within(dialog()).getByTestId('DeleteRecipe-cancel'));
    assert.equal(dialog().open, false);
  });
});

describe('recipe-deletion › Click outside closes the popup', () => {
  test('a click inside the popup leaves it open', () => {
    open();
    fireEvent.click(within(dialog()).getByTestId('DeleteRecipe-title'));
    assert.equal(dialog().open, true);
  });

  test('a click on the padding leaves it open', () => {
    open();
    // The padding belongs to the inner form, so a click on it is not a click on the backdrop.
    fireEvent.click(dialog().firstElementChild!);
    assert.equal(dialog().open, true);
  });

  test('a click on the backdrop (the dialog element itself) closes it', () => {
    open();
    fireEvent.click(dialog());
    assert.equal(dialog().open, false);
  });
});

// Escape and the focus trap come from the browser's modal dialog, which happy-dom does not implement.
test.todo('recipe-deletion › Escape closes the popup');
