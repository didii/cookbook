import assert from 'node:assert/strict';
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { RecipeActionsMenu } from './RecipeActionsMenu';

/** The page a link leads to: shows the navigation state. */
function Target() {
  const { state } = useLocation() as { state: { fresh?: boolean } | null };
  return <p data-testid="Test-fresh">{String(state?.fresh)}</p>;
}

// The menu sits in a layout route, so it stays mounted after a link is followed.
const menu = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '/',
          element: (
            <>
              <RecipeActionsMenu slug="appeltaart" />
              <p data-testid="Test-outside" />
              <Outlet />
            </>
          ),
          children: [
            { index: true, element: null },
            { path: '*', element: <Target /> },
          ],
        },
      ])}
    />,
  );
const button = () => screen.getByTestId('RecipeActionsMenu-button');
const open = () => {
  menu();
  fireEvent.click(button());
};

describe('recipe-actions-menu › The button tells whether the menu is open', () => {
  test('it is expanded while open', () => {
    open();
    assert.equal(button().getAttribute('aria-expanded'), 'true');
  });

  test('it is collapsed again once closed', () => {
    open();
    fireEvent.click(button());
    assert.equal(button().getAttribute('aria-expanded'), 'false');
  });

  test('it controls the panel', () => {
    open();
    assert.equal(button().getAttribute('aria-controls'), screen.getByTestId('RecipeActionsMenu-panel').id);
  });
});

describe('recipe-actions-menu › The menu lists its items', () => {
  test('the menu is closed at first', () => {
    menu();
    assert.equal(screen.queryByTestId('RecipeActionsMenu-panel'), null);
  });

  test('it lists Bewerk, Kopieer and Deel in that order', () => {
    open();
    const items = ['edit', 'copy', 'share'].map((name) => screen.getByTestId(`RecipeActionsMenu-${name}`));
    assert.ok(precedes(items[0]!, items[1]!));
    assert.ok(precedes(items[1]!, items[2]!));
  });

  test('it lists no other items', () => {
    open();
    assert.equal(screen.getByTestId('RecipeActionsMenu-panel').children.length, 3);
  });
});

describe('recipe-actions-menu › Bewerk links to the edit form', () => {
  test('Bewerk points at the edit address', () => {
    open();
    assert.equal(screen.getByTestId('RecipeActionsMenu-edit').getAttribute('href'), '/recepten/appeltaart/bewerken');
  });

  test('it navigates with the state that starts the editor fresh', async () => {
    open();
    fireEvent.click(screen.getByTestId('RecipeActionsMenu-edit'));
    assert.equal((await screen.findByTestId('Test-fresh')).textContent, 'true');
  });
});

describe('recipe-actions-menu › Kopieer links to the copy form', () => {
  test('Kopieer points at the copy address of the recipe', () => {
    open();
    assert.equal(screen.getByTestId('RecipeActionsMenu-copy').getAttribute('href'), '/recepten/nieuw?kopie=appeltaart');
  });

  test('Kopieer is not disabled', () => {
    open();
    assert.equal(screen.getByTestId('RecipeActionsMenu-copy').getAttribute('aria-disabled'), null);
  });

  test('it navigates with the state that starts the editor fresh', async () => {
    open();
    fireEvent.click(screen.getByTestId('RecipeActionsMenu-copy'));
    assert.equal((await screen.findByTestId('Test-fresh')).textContent, 'true');
  });
});

describe('recipe-actions-menu › Deel is disabled', () => {
  test('Deel is disabled', () => {
    open();
    assert.equal(screen.getByTestId<HTMLButtonElement>('RecipeActionsMenu-share').disabled, true);
  });
});

describe('recipe-actions-menu › Escape closes the menu', () => {
  test('the menu closes', () => {
    open();
    fireEvent.keyDown(document, { key: 'Escape' });
    assert.equal(screen.queryByTestId('RecipeActionsMenu-panel'), null);
  });

  test('the menu button has the focus', () => {
    open();
    fireEvent.keyDown(document, { key: 'Escape' });
    assert.equal(document.activeElement, button());
  });
});

describe('recipe-actions-menu › A click outside closes the menu', () => {
  test('the menu closes', () => {
    open();
    fireEvent.pointerDown(screen.getByTestId('Test-outside'));
    assert.equal(screen.queryByTestId('RecipeActionsMenu-panel'), null);
  });

  test('a press inside the menu keeps it open', () => {
    open();
    fireEvent.pointerDown(screen.getByTestId('RecipeActionsMenu-panel'));
    assert.ok(screen.getByTestId('RecipeActionsMenu-panel'));
  });
});

describe('recipe-actions-menu › Choosing an item closes the menu', () => {
  test('the menu closes', async () => {
    open();
    fireEvent.click(screen.getByTestId('RecipeActionsMenu-edit'));
    await screen.findByTestId('Test-fresh');
    assert.equal(screen.queryByTestId('RecipeActionsMenu-panel'), null);
  });
});
