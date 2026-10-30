import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import AdminLayout from './AdminLayoutRoute';

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
    const page = await screen.findByTestId('page');
    assert.equal(page.closest('main')?.id, 'main');
  });

  test('the navigation follows the role from the root loader', async () => {
    show('superadmin');
    assert.equal((await screen.findAllByTestId('AdminNav-link')).length, 3);
  });
});

describe('admin-nav › Link leads to its page', () => {
  test('following the photos link shows the photos page with the navigation in place', async () => {
    show('admin');
    fireEvent.click((await screen.findAllByTestId('AdminNav-link'))[1]);
    await screen.findByTestId('photos');
    assert.equal(screen.getAllByTestId('AdminNav-link').length, 2);
  });
});
