import assert from 'node:assert/strict';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import { describe, test, vi } from 'vitest';
import { fireEvent, precedes, render, screen, within } from '~testing/dom';
import AdminLayout from './AdminLayoutRoute';

// Stand-in for the child (it has its own test): it shows the role it gets and links to the photos page.
vi.mock('./lib/AdminNav', () => ({
  AdminNav: ({ role }: { role: string }) => (
    <nav data-testid="AdminNav-nav" data-role={role}>
      <Link to="/beheer/fotos" data-testid="AdminNav-link">
        Foto&apos;s
      </Link>
    </nav>
  ),
}));

const show = (role: 'admin' | 'superadmin') => {
  const router = createMemoryRouter(
    [
      {
        id: 'root',
        HydrateFallback: () => null,
        loader: () => ({ email: 'a@b.c', role }),
        children: [
          {
            path: '/beheer',
            Component: AdminLayout,
            children: [
              { path: 'herkenning', element: <p data-testid="page">Pagina</p> },
              { path: 'fotos', element: <p data-testid="photos">Foto&apos;s</p> },
            ],
          },
        ],
      },
    ],
    { initialEntries: ['/beheer/herkenning'] },
  );
  return render(<RouterProvider router={router} />);
};

describe('admin-nav › Rules page inside the layout', () => {
  test('the navigation comes before the page content', async () => {
    show('admin');
    assert.ok(precedes(await screen.findByTestId('AdminNav-nav'), screen.getByTestId('page')));
  });

  test('the page content is in the one main', async () => {
    show('admin');
    const main = await screen.findByTestId('AdminLayout-main');
    assert.equal(main.id, 'main');
    assert.ok(within(main).getByTestId('page'));
  });

  test('the navigation gets the role from the root loader', async () => {
    show('superadmin');
    assert.equal((await screen.findByTestId('AdminNav-nav')).dataset.role, 'superadmin');
  });
});

describe('admin-nav › Link leads to its page', () => {
  test('following the photos link shows the photos page with the navigation in place', async () => {
    show('admin');
    fireEvent.click((await screen.findAllByTestId('AdminNav-link'))[0]);
    await screen.findByTestId('photos');
    assert.ok(screen.getByTestId('AdminNav-nav'));
  });
});
