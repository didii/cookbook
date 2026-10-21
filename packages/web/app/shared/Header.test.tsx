import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen } from '~testing/dom';
import { routePaths } from '~testing/routes';
import { MemoryRouter } from 'react-router';
import { Header } from './Header';

test('recipe-creation › Link to the form', () => {
  render(
    <MemoryRouter>
      <Header email="oma@example.com" />
    </MemoryRouter>,
  );
  // The link lives in the menu, not in the header itself.
  assert.equal(screen.queryByTestId('Header-new'), null);
  fireEvent.click(screen.getByTestId('SiteMenu-open'));
  const link = screen.getAllByTestId('SiteMenu-link').find((a) => a.textContent === 'Nieuw recept');
  assert.equal(link?.getAttribute('href'), '/recepten/nieuw');
  // The route table serves it.
  assert.ok(routePaths.includes('recepten/nieuw'));
});
