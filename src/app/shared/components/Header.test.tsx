import assert from 'node:assert/strict';
import { MemoryRouter } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { routePaths } from '~testing/routes';
import { Header } from './Header';

const memberRole = 'user' as const;

describe('recipe-creation › Link to the form', () => {
  const show = () =>
    render(
      <MemoryRouter>
        <Header email="oma@example.com" role={memberRole} />
      </MemoryRouter>,
    );

  test('the header itself has no link', () => {
    show();
    // The link lives in the menu, not in the header itself.
    assert.equal(screen.queryByTestId('Header-new'), null);
  });

  test('the menu links to the new recipe form', () => {
    show();
    fireEvent.click(screen.getByTestId('SiteMenu-open'));
    const link = screen.getAllByTestId('SiteMenu-link').find((a) => a.textContent === 'Nieuw recept');
    assert.equal(link?.getAttribute('href'), '/recepten/nieuw');
  });

  test('the route table serves it', () => {
    assert.ok(routePaths.includes('recepten/nieuw'));
  });
});
