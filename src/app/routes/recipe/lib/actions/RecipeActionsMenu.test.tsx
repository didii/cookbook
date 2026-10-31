import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { RecipeActionsMenu } from './RecipeActionsMenu';

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
            </>
          ),
        },
        { path: '*', element: null },
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
});

describe('recipe-actions-menu › Kopieer is disabled', () => {
  test('Kopieer is disabled', () => {
    open();
    assert.equal(screen.getByTestId<HTMLButtonElement>('RecipeActionsMenu-copy').disabled, true);
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
  test('the menu closes', () => {
    open();
    fireEvent.click(screen.getByTestId('RecipeActionsMenu-edit'));
    assert.equal(screen.queryByTestId('RecipeActionsMenu-panel'), null);
  });
});
