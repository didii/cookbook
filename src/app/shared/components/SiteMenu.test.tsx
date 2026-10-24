import assert from 'node:assert/strict';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { SiteMenu } from './SiteMenu';
import type { Role } from '../role';

const show = (role: Role = 'user') => {
  const router = createMemoryRouter([
    // The menu sits in a layout, as in the app, so it survives the navigation.
    {
      element: (
        <>
          <SiteMenu role={role} />
          <Outlet />
        </>
      ),
      children: [
        { path: '/', element: <p>Start</p> },
        { path: '/over', element: <p data-testid="about">Over pagina</p> },
      ],
    },
  ]);
  const view = render(<RouterProvider router={router} />);
  return { ...view, dialog: screen.getByTestId('SiteMenu-dialog') };
};
const links = (dialog: HTMLElement) => [...dialog.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
const openMenu = () => fireEvent.click(screen.getByTestId('SiteMenu-open'));

const labels = (role: Role) => {
  const { dialog } = show(role);
  openMenu();
  return links(dialog).map(([label]) => label);
};

describe('site-menu › Menu lists the links', () => {
  test('the menu starts closed', () => {
    const { dialog } = show();
    assert.equal(dialog.hasAttribute('open'), false);
  });

  test('the open button opens it', () => {
    const { dialog } = show();
    openMenu();
    assert.equal(dialog.hasAttribute('open'), true);
  });

  test('it lists the links', () => {
    const { dialog } = show();
    openMenu();
    assert.deepEqual(links(dialog), [
      ['Nieuw recept', '/recepten/nieuw'],
      ['Instellingen', '/instellingen'],
      ['Over', '/over'],
    ]);
  });
});

describe('parsing-rules › Admin sees the link', () => {
  test('the link is in the menu', () => {
    assert.equal(labels('admin').includes('Herkenning'), true);
  });

  test('the superadmin link is not in the menu', () => {
    assert.equal(labels('admin').includes('Gebruikers'), false);
  });

  test('it points to the parsing rules', () => {
    labels('admin');
    assert.deepEqual(links(screen.getByTestId('SiteMenu-dialog')).at(-1), ['Herkenning', '/beheer/herkenning']);
  });
});

describe('parsing-rules › Superadmin sees the link', () => {
  test('the link is in the menu', () => {
    assert.equal(labels('superadmin').includes('Herkenning'), true);
  });
});

describe('parsing-rules › User does not see the link', () => {
  test('the link is not in the menu', () => {
    assert.equal(labels('user').includes('Herkenning'), false);
  });
});

describe('site-menu › Menu lists the links for a superadmin', () => {
  test('the menu lists all links', () => {
    assert.deepEqual(labels('superadmin'), ['Nieuw recept', 'Instellingen', 'Over', 'Herkenning', 'Gebruikers']);
  });

  test('the last link points to the users page', () => {
    labels('superadmin');
    assert.deepEqual(links(screen.getByTestId('SiteMenu-dialog')).at(-1), ['Gebruikers', '/beheer/gebruikers']);
  });
});

describe('site-menu › Menu lists the links for an admin', () => {
  test('the menu lists the links without the users page', () => {
    assert.deepEqual(labels('admin'), ['Nieuw recept', 'Instellingen', 'Over', 'Herkenning']);
  });
});

// Needs a browser: the slide is a CSS transition on the open dialog.
test.todo('site-menu › Menu slides in and out');

describe('site-menu › Menu closes', () => {
  // Needs a browser: happy-dom does not do Escape, and the close is the browser's.
  test.todo('Escape closes it');

  test('the close button is labelled', () => {
    show();
    openMenu();
    assert.equal(screen.getByTestId('SiteMenu-close').getAttribute('aria-label'), 'Sluit menu');
  });

  test('the close button closes it', () => {
    const { dialog } = show();
    openMenu();
    fireEvent.click(screen.getByTestId('SiteMenu-close'));
    assert.equal(dialog.hasAttribute('open'), false);
  });

  test('a click on the backdrop closes it', () => {
    const { dialog } = show();
    openMenu();
    fireEvent.click(dialog);
    assert.equal(dialog.hasAttribute('open'), false);
  });

  test('a click inside the panel (its padding, not a link) leaves it open', () => {
    const { dialog } = show();
    openMenu();
    fireEvent.click(screen.getByTestId('SiteMenu-panel'));
    assert.equal(dialog.hasAttribute('open'), true);
  });
});

describe('site-menu › Following a link closes the menu', () => {
  const follow = async () => {
    const { dialog } = show();
    openMenu();
    fireEvent.click(screen.getAllByTestId('SiteMenu-link')[2]!);
    await screen.findByTestId('about');
    return dialog;
  };

  test('the menu stays in the layout', async () => {
    assert.equal((await follow()).isConnected, true);
  });

  test('the menu is closed', async () => {
    assert.equal((await follow()).hasAttribute('open'), false);
  });
});
