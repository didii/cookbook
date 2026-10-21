import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen } from '~testing/dom';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { SiteMenu } from './SiteMenu';

const show = () => {
  const router = createMemoryRouter([
    // The menu sits in a layout, as in the app, so it survives the navigation.
    {
      element: (
        <>
          <SiteMenu />
          <Outlet />
        </>
      ),
      children: [
        { path: '/', element: <p>Start</p> },
        { path: '/over', element: <p>Over pagina</p> },
      ],
    },
  ]);
  const view = render(<RouterProvider router={router} />);
  return { ...view, dialog: screen.getByTestId('SiteMenu-dialog') };
};
const links = (dialog: HTMLElement) => [...dialog.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);

test('site-menu › Menu lists the links', () => {
  const { dialog } = show();
  assert.equal(dialog.hasAttribute('open'), false);
  fireEvent.click(screen.getByTestId('SiteMenu-open'));
  assert.equal(dialog.hasAttribute('open'), true);
  assert.deepEqual(links(dialog), [
    ['Nieuw recept', '/recepten/nieuw'],
    ['Instellingen', '/instellingen'],
    ['Over', '/over'],
  ]);
});

test('site-menu › Menu closes', () => {
  const { dialog } = show();
  const openMenu = () => fireEvent.click(screen.getByTestId('SiteMenu-open'));
  openMenu();
  // Escape closes a modal dialog in the browser by firing `cancel` and then closing, unless `cancel` is prevented. happy-dom does not do Escape, so this checks nothing stops the cancel; the close itself is the browser's.
  assert.equal(fireEvent(dialog, new Event('cancel', { cancelable: true })), true);
  // The close button and a click on the backdrop close it too.
  openMenu();
  fireEvent.click(screen.getByTestId('SiteMenu-close'));
  assert.equal(dialog.hasAttribute('open'), false);
  openMenu();
  fireEvent.click(dialog);
  assert.equal(dialog.hasAttribute('open'), false);
  // A click inside the panel (its padding, not a link) leaves it open.
  openMenu();
  fireEvent.click(screen.getByTestId('SiteMenu-panel'));
  assert.equal(dialog.hasAttribute('open'), true);
});

test('site-menu › Following a link closes the menu', async () => {
  const { dialog } = show();
  fireEvent.click(screen.getByTestId('SiteMenu-open'));
  fireEvent.click(screen.getAllByTestId('SiteMenu-link')[2]!);
  await screen.findByText('Over pagina');
  assert.equal(dialog.isConnected, true);
  assert.equal(dialog.hasAttribute('open'), false);
});
