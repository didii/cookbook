import assert from 'node:assert/strict';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import type { Role } from '~app/shared/role';
import { cssFor } from '~testing/css';
import { fireEvent, render, screen } from '~testing/dom';
import { SiteMenu } from './SiteMenu';

const show = (role: Role = 'user', path = '/') => {
  const router = createMemoryRouter(
    [
    // The menu sits in a layout, as in the app, so it survives the navigation.
    {
      element: (
        <>
          <SiteMenu role={role} />
          <Outlet />
        </>
      ),
      children: [
        { path: '/', element: <p data-testid="home">Start</p> },
        { path: '/over', element: <p data-testid="about">Over pagina</p> },
      ],
    },
    ],
    { initialEntries: [path] },
  );
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
      ['Home', '/'],
      ['Nieuw recept', '/recepten/nieuw'],
      ['Recept importeren', '/recepten/importeren'],
      ['Tags', '/tags'],
      ['Instellingen', '/instellingen'],
      ['Over', '/over'],
      ['Uitloggen', '/cdn-cgi/access/logout'],
    ]);
  });
});

describe('site-menu › Home link', () => {
  const follow = async (role: Role) => {
    const { dialog } = show(role, '/over');
    openMenu();
    fireEvent.click(screen.getAllByTestId('SiteMenu-link').find((link) => link.textContent === 'Home')!);
    await screen.findByTestId('home');
    return dialog;
  };

  test.each(['user', 'admin', 'superadmin'] as const)('the %s is taken to the home page', async (role) => {
    await follow(role);
    assert.ok(screen.getByTestId('home'));
  });

  test('the menu is closed', async () => {
    assert.equal((await follow('user')).hasAttribute('open'), false);
  });
});

describe('site-menu › Tags link', () => {
  test.each(['user', 'admin', 'superadmin'] as const)('the %s sees a link to the tag manager', (role) => {
    labels(role);
    assert.deepEqual(
      links(screen.getByTestId('SiteMenu-dialog')).find(([label]) => label === 'Tags'),
      ['Tags', '/tags'],
    );
  });
});

describe('site-menu › Import link', () => {
  test.each(['user', 'admin', 'superadmin'] as const)('the %s sees a link to the import page', (role) => {
    labels(role);
    assert.deepEqual(
      links(screen.getByTestId('SiteMenu-dialog')).find(([label]) => label === 'Recept importeren'),
      ['Recept importeren', '/recepten/importeren'],
    );
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
    assert.deepEqual(
      links(screen.getByTestId('SiteMenu-dialog')).find(([label]) => label === 'Herkenning'),
      ['Herkenning', '/beheer/herkenning'],
    );
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
    assert.deepEqual(labels('superadmin'), [
      'Home',
      'Nieuw recept',
      'Recept importeren',
      'Tags',
      'Instellingen',
      'Over',
      'Herkenning',
      'Gebruikers',
      'Uitloggen',
    ]);
  });

  test('Gebruikers points to the users page', () => {
    labels('superadmin');
    assert.deepEqual(
      links(screen.getByTestId('SiteMenu-dialog')).find(([label]) => label === 'Gebruikers'),
      ['Gebruikers', '/beheer/gebruikers'],
    );
  });
});

describe('site-menu › Menu lists the links for an admin', () => {
  test('the menu lists the links without the users page', () => {
    assert.deepEqual(labels('admin'), ['Home', 'Nieuw recept', 'Recept importeren', 'Tags', 'Instellingen', 'Over', 'Herkenning', 'Uitloggen']);
  });
});

describe('site-menu › Logging out', () => {
  test('Uitloggen points to the Access logout', () => {
    show();
    openMenu();
    assert.equal(screen.getByTestId('SiteMenu-logout').getAttribute('href'), '/cdn-cgi/access/logout');
  });

  test('a click is not intercepted by the router', () => {
    show();
    openMenu();
    assert.equal(fireEvent.click(screen.getByTestId('SiteMenu-logout')), true);
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
    fireEvent.click(screen.getAllByTestId('SiteMenu-link').find((link) => link.textContent === 'Over')!);
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

describe('plaid-accent › Top of the sidebar is plaid', () => {
  const open = () => {
    show();
    openMenu();
    return screen.getByTestId('SiteMenu-top');
  };

  test('the top section holds a plaid layer', () => {
    assert.ok(open().contains(screen.getByTestId('Plaid-layer')));
  });

  test('the rest of the sidebar has no plaid', () => {
    open();
    assert.equal(screen.getAllByTestId('Plaid-layer').length, 1);
  });

  test('the top section ends in a fret, like the header', () => {
    assert.ok(open().contains(screen.getByTestId('Fret-strip')));
  });
});

describe('plaid-accent › Plaid section is as tall as the header', () => {
  test('the top section is as tall as the header token', async () => {
    show();
    openMenu();
    assert.match(await cssFor(screen.getByTestId('SiteMenu-top').className), /height: var\(--spacing-header\)/);
  });
});

describe('plaid-accent › Close button on the plaid', () => {
  const closeStyle = async () => {
    show();
    openMenu();
    return cssFor(screen.getByTestId('SiteMenu-close').className);
  };

  test('the close button sits in the plaid section', () => {
    show();
    openMenu();
    assert.ok(screen.getByTestId('SiteMenu-top').contains(screen.getByTestId('SiteMenu-close')));
  });

  test('the close button is 0.5rem from the left edge', async () => {
    assert.match(await closeStyle(), /margin-left: calc\(var\(--spacing\) \* 2\)/);
  });

  test('the close button has no border and no fill', async () => {
    // The hover tint is the only fill the button may have.
    const resting = (await closeStyle()).split(':root')[0]!.replace(/[^{}]*:hover[^{}]*\{[^{}]*\}/g, '');
    assert.doesNotMatch(resting, /border-(width|style|color)|background/);
  });
});

describe('plaid-accent › Plaid is hidden from assistive technology', () => {
  test('the plaid layer is aria-hidden', () => {
    show();
    openMenu();
    assert.equal(screen.getByTestId('Plaid-layer').getAttribute('aria-hidden'), 'true');
  });
});
