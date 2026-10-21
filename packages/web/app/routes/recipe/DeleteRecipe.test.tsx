import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, precedes, render, screen, within } from '~testing/dom';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RecipePage } from './RecipePage';

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
      router={createMemoryRouter([{ path: '/', element: <RecipePage recipe={recipe} tile={0} steps={[{ body: 'bakken', ingredients: [] }]} /> }])}
    />,
  );
const trigger = () => screen.getByRole('button', { name: 'Verwijder recept' });
const dialog = () => document.querySelector('dialog')!;
/** Opens the popup. Happy-dom has no real modal, so `open` is what the tests look at. */
const open = () => {
  show();
  fireEvent.click(trigger());
};

test('recipe-deletion › Delete button is shown', () => {
  show();
  assert.ok(precedes(screen.getByText('bakken'), trigger()));
  assert.equal(trigger().closest('header'), null);
});

test('recipe-deletion › Popup asks for confirmation', () => {
  show();
  assert.equal(dialog().open, false);
  fireEvent.click(trigger());
  assert.equal(dialog().open, true);
  const popup = within(dialog());
  assert.ok(popup.getByRole('heading').textContent?.includes('Appeltaart'));
  assert.ok(popup.getByRole('button', { name: 'Verwijderen' }) && popup.getByRole('button', { name: 'Annuleren' }));
  assert.equal(popup.getByRole('button', { name: 'Verwijderen' }).getAttribute('type'), 'submit');
});

test('recipe-deletion › Cancel closes the popup', () => {
  open();
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Annuleren' }));
  assert.equal(dialog().open, false);
});

test('recipe-deletion › Click outside closes the popup', () => {
  open();
  // A click inside the popup leaves it open; one on the backdrop (the dialog element itself) closes it.
  fireEvent.click(within(dialog()).getByRole('heading'));
  assert.equal(dialog().open, true);
  fireEvent.click(dialog());
  assert.equal(dialog().open, false);
});

// Escape and the focus trap come from the browser's modal dialog, which happy-dom does not implement.
test.todo('recipe-deletion › Escape closes the popup');
