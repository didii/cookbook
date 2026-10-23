import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { render, screen } from '~testing/dom';
import { UserList } from './UserList';

const users = [
  { id: 1, email: 'anna@example.com', callingName: 'Anna', role: 'user' as const },
  { id: 2, email: 'jos@example.com', callingName: 'Jos', role: 'admin' as const },
];

/** The list sits above the outlet, as in the master route; `/:id` is a stand-in for the detail. */
const show = (path: string, capped = false) =>
  render(
    <RouterProvider
      router={createMemoryRouter(
        [
          {
            path: '/beheer/gebruikers',
            element: (
              <>
                <UserList users={users} capped={capped} limit={100} />
                <Outlet />
              </>
            ),
            children: [{ path: ':id', element: <p data-testid="detail">Detail</p> }],
          },
        ],
        { initialEntries: [path] },
      )}
    />,
  );

describe('user-management › No user selected', () => {
  test('lists every user', () => {
    show('/beheer/gebruikers');
    assert.equal(screen.getAllByTestId('UserList-user').length, 2);
  });

  test('shows no detail', () => {
    show('/beheer/gebruikers');
    assert.equal(screen.queryByTestId('detail'), null);
  });
});

describe('UserList', () => {
  test('the cap message names the limit', () => {
    show('/beheer/gebruikers', true);
    assert.match(screen.getByTestId('UserList-capped').textContent!, /meer dan 100 gebruikers.*eerste 100/);
  });

  test('the selected user is marked', () => {
    show('/beheer/gebruikers/2');
    const [anna, jos] = screen.getAllByTestId('UserList-user');
    assert.deepEqual([anna.getAttribute('aria-current'), jos.getAttribute('aria-current')], [null, 'page']);
  });

  test('the list stays beside the detail', () => {
    show('/beheer/gebruikers/2');
    assert.equal(screen.getByTestId('detail').textContent, 'Detail');
  });
});
