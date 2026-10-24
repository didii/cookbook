import assert from 'node:assert/strict';
import { MemoryRouter } from 'react-router';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
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

  test('the header has the menu button', () => {
    show();
    assert.notEqual(screen.queryByTestId('SiteMenu-open'), null);
  });
});
