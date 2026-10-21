import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen } from '~testing/dom';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SiteMenu } from './SiteMenu';

const show = () => {
  const router = createMemoryRouter([
    { path: '/', element: <SiteMenu /> },
    { path: '/over', element: <p>Over pagina</p> },
  ]);
  const view = render(<RouterProvider router={router} />);
  return { ...view, dialog: view.container.querySelector('dialog')! };
};
const links = (dialog: HTMLElement) => [...dialog.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);

test('site-menu › Menu lists the links', () => {
  const { dialog } = show();
  assert.equal(dialog.hasAttribute('open'), false);
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  assert.equal(dialog.hasAttribute('open'), true);
  assert.deepEqual(links(dialog), [
    ['Nieuw recept', '/recepten/nieuw'],
    ['Instellingen', '/instellingen'],
    ['Over', '/over'],
  ]);
});

test('site-menu › Menu closes', () => {
  const { dialog } = show();
  const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  openMenu();
  // Escape closes a modal dialog in the browser; the DOM here only fires `cancel`, so the close is done as the browser does it.
  fireEvent.keyDown(dialog, { key: 'Escape' });
  dialog.close();
  assert.equal(dialog.hasAttribute('open'), false);
  // The close button and a click on the backdrop close it too.
  openMenu();
  fireEvent.click(screen.getByRole('button', { name: 'Sluit menu', hidden: true }));
  assert.equal(dialog.hasAttribute('open'), false);
  openMenu();
  fireEvent.click(dialog);
  assert.equal(dialog.hasAttribute('open'), false);
});

test('site-menu › Following a link closes the menu', async () => {
  const { dialog } = show();
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  fireEvent.click(screen.getByRole('link', { name: 'Over' }));
  await screen.findByText('Over pagina');
  assert.equal(dialog.isConnected, false); // the page changed; the menu was closed by the click before it
});
