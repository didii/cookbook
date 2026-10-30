import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import type { Role } from '~app/shared/role';
import { cssFor, mediaFor } from '~testing/css';
import { render, screen } from '~testing/dom';
import { AdminNav } from './AdminNav';

const show = (role: Role, path = '/beheer/herkenning') => {
  const router = createMemoryRouter(
    ['/beheer/herkenning', '/beheer/fotos', '/beheer/gebruikers', '/beheer/gebruikers/:id'].map((p) => ({
      path: p,
      element: <AdminNav role={role} />,
    })),
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
};
const links = () => screen.getAllByTestId('AdminNav-link');

describe('admin-nav › Navigation on every admin page', () => {
  test('the navigation is titled "Beheer"', () => {
    show('superadmin');
    assert.equal(screen.getByTestId('AdminNav-nav').getAttribute('aria-label'), 'Beheer');
  });

  test.each(['/beheer/herkenning', '/beheer/fotos', '/beheer/gebruikers'])('on %s it lists the pages in order', (path) => {
    show('superadmin', path);
    assert.deepEqual(
      links().map((a) => [a.textContent, a.getAttribute('href')]),
      [
        ['Herkenning', '/beheer/herkenning'],
        ["Foto's", '/beheer/fotos'],
        ['Gebruikers', '/beheer/gebruikers'],
      ],
    );
  });
});

describe('admin-nav › Current page is marked', () => {
  test('only the link of the current page is current', () => {
    show('superadmin', '/beheer/fotos');
    assert.deepEqual(
      links().map((a) => a.getAttribute('aria-current')),
      [null, 'page', null],
    );
  });
});

describe('admin-nav › Selected user keeps the user link current', () => {
  test('"Gebruikers" is current on a user\'s detail', () => {
    show('superadmin', '/beheer/gebruikers/12');
    assert.equal(links()[2].getAttribute('aria-current'), 'page');
  });
});

describe('admin-nav › Admin does not see Gebruikers', () => {
  test("the list has Herkenning and Foto's only", () => {
    show('admin');
    assert.deepEqual(
      links().map((a) => a.textContent),
      ['Herkenning', "Foto's"],
    );
  });
});

describe('admin-nav › Superadmin sees all', () => {
  test('the list has all three pages', () => {
    show('superadmin');
    assert.deepEqual(
      links().map((a) => a.textContent),
      ['Herkenning', "Foto's", 'Gebruikers'],
    );
  });
});

describe('admin-nav › Wide screen', () => {
  test('the navigation is sticky from 64rem', async () => {
    show('admin');
    const classes = screen.getByTestId('AdminNav-nav').className;
    assert.match(await mediaFor(classes, '(width >= 64rem)'), /position: sticky/);
  });
});

describe('admin-nav › Narrow screen', () => {
  // Needs a browser: whether the navigation scrolls away depends on real scrolling.
  test.todo('the navigation scrolls away with the page');

  test('it is not sticky below 64rem', async () => {
    show('admin');
    const classes = screen.getByTestId('AdminNav-nav').className;
    const all = (await cssFor(classes)).replace(/\s+/g, ' ');
    assert.doesNotMatch(all.replace(await mediaFor(classes, '(width >= 64rem)'), ''), /position: sticky/);
  });

  test('the links are in one list, one under the other', () => {
    show('admin');
    assert.equal(screen.getByTestId('AdminNav-list').children.length, 2);
  });
});
