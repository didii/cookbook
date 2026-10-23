import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen, within } from '~testing/dom';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { DeleteUser } from './DeleteUser';

// The delete form is a data-router `Form`, so the component needs a data router around it.
const show = (props: Partial<Parameters<typeof DeleteUser>[0]> = {}) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { path: '/', element: <DeleteUser name="Jos" isSelf={false} accessUrl="https://access.example.com/" {...props} /> },
      ])}
    />,
  );
const dialog = () => document.querySelector('dialog')!;
const open = (props: Partial<Parameters<typeof DeleteUser>[0]> = {}) => {
  show(props);
  fireEvent.click(screen.getByTestId('DeleteUser-open'));
};

test('user-management › Popup asks for confirmation', () => {
  show();
  assert.equal(dialog().open, false);
  fireEvent.click(screen.getByTestId('DeleteUser-open'));
  assert.equal(dialog().open, true);
  const popup = within(dialog());
  assert.ok(popup.getByTestId('DeleteUser-title').textContent?.includes('Jos'));
  assert.equal(popup.getByTestId('DeleteUser-confirm').textContent, 'Verwijderen');
  assert.equal(popup.getByTestId('DeleteUser-confirm').getAttribute('type'), 'submit');
  assert.equal(popup.getByTestId('DeleteUser-cancel').textContent, 'Annuleren');
  assert.equal(document.querySelector<HTMLInputElement>('input[name=intent]')?.value, 'delete');
});

test('user-management › Cancel closes the popup', () => {
  open();
  fireEvent.click(within(dialog()).getByTestId('DeleteUser-cancel'));
  assert.equal(dialog().open, false);
});

test('a click on the backdrop closes the popup, a click inside leaves it open', () => {
  open();
  fireEvent.click(within(dialog()).getByTestId('DeleteUser-title'));
  assert.equal(dialog().open, true);
  fireEvent.click(dialog());
  assert.equal(dialog().open, false);
});

test('user-management › Popup explains the allowlist', () => {
  open();
  const popup = within(dialog());
  assert.match(popup.getByTestId('DeleteUser-allowlist').textContent!, /opnieuw inloggen zolang het e-mailadres op de toegestane lijst staat/);
  assert.equal(popup.getByTestId('DeleteUser-link').getAttribute('href'), 'https://access.example.com/');
});

test('user-management › Popup for your own record warns about losing access', () => {
  open({ isSelf: true });
  assert.match(within(dialog()).getByTestId('DeleteUser-warning').textContent!, /verliest.*toegang/);
});

test('the popup for another record has no access warning', () => {
  open();
  assert.equal(screen.queryByTestId('DeleteUser-warning'), null);
});

test('a disabled button shows its reason beside it', () => {
  show({ disabledReason: 'De enige superadmin kan niet worden verwijderd' });
  const button = screen.getByTestId<HTMLButtonElement>('DeleteUser-open');
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-describedby'), screen.getByTestId('DeleteUser-reason').id);
});

// Escape and the focus trap come from the browser's modal dialog, which happy-dom does not implement.
test.todo('Escape closes the delete popup');
