import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { Role } from '~app/shared/role';
import { fireEvent, render, screen } from '~testing/dom';
import { UserForm } from './UserForm';

const jos = { id: 2, email: 'jos@example.com', callingName: 'Jos', role: 'admin' as Role };

// The form is a data-router `Form`, so it needs a data router around it.
const show = (props: Partial<Parameters<typeof UserForm>[0]> = {}) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '/',
          action: () => null,
          element: <UserForm user={jos} lastSuperadmin={false} isSelf={false} accessUrl="https://access.example.com/" {...props} />,
        },
      ])}
    />,
  );
const nameInput = () => screen.getByTestId<HTMLInputElement>('UserForm-name');
const roleSelect = () => screen.getByTestId('UserForm-role') as unknown as HTMLSelectElement;

test('user-management › Selecting a user', () => {
  show();
  assert.equal(screen.getByTestId('UserForm-email').textContent, 'jos@example.com');
  assert.equal(screen.getByTestId('UserForm-email').tagName, 'SPAN');
  assert.deepEqual([nameInput().value, roleSelect().value], ['Jos', 'admin']);
  assert.deepEqual(
    [...roleSelect().options].map((o) => o.value),
    ['user', 'admin', 'superadmin'],
  );
});

test('user-management › Reset the form', () => {
  show();
  fireEvent.change(nameInput(), { target: { value: 'Josje' } });
  fireEvent.change(roleSelect(), { target: { value: 'user' } });
  assert.deepEqual([nameInput().value, roleSelect().value], ['Josje', 'user']);
  fireEvent.click(screen.getByTestId('UserForm-reset'));
  // Happy-dom does not reset a <select>; a browser restores it from the option React marked as default.
  assert.equal(nameInput().value, 'Jos');
  assert.equal([...roleSelect().options].find((o) => o.defaultSelected)?.value, 'admin');
});

test('user-management › Sole superadmin selects own record', () => {
  show({ user: { ...jos, role: 'superadmin' }, lastSuperadmin: true });
  assert.equal(roleSelect().disabled, true);
  assert.equal(nameInput().disabled, false);
  assert.equal(screen.getByTestId<HTMLButtonElement>('DeleteUser-open').disabled, true);
  assert.equal(screen.getByTestId('DeleteUser-reason').textContent, 'De enige superadmin kan niet worden verwijderd');
  assert.equal(screen.getByTestId('UserForm-reason').textContent, 'De rol van de enige superadmin kan niet worden gewijzigd');
});

test('user-management › Reason next to a disabled control', () => {
  show({ user: { ...jos, role: 'superadmin' }, lastSuperadmin: true });
  const reason = screen.getByTestId('UserForm-reason');
  assert.equal(roleSelect().getAttribute('aria-describedby'), reason.id);
});

test('a refused change and the blank-name message are shown', () => {
  show({ error: 'Vul een roepnaam in.', refused: 'Onbekende rol.' });
  assert.equal(screen.getByTestId('UserForm-error').textContent, 'Vul een roepnaam in.');
  assert.equal(nameInput().getAttribute('aria-invalid'), 'true');
  assert.equal(screen.getByTestId('UserForm-refused').textContent, 'Onbekende rol.');
});

const me = { ...jos, role: 'superadmin' as Role };
const popup = () => screen.getByTestId<HTMLDialogElement>('UserForm-warning');
// A save that is not held back by the popup would really submit; the router cannot do that in happy-dom, and these tests only look at the popup.
document.addEventListener('submit', (e) => e.stopPropagation(), { capture: true });

test('user-management › Popup warns about losing access', () => {
  show({ user: me, isSelf: true });
  fireEvent.change(roleSelect(), { target: { value: 'admin' } });
  fireEvent.click(screen.getByTestId('UserForm-save'));
  assert.equal(popup().open, true);
  assert.match(popup().textContent!, /verliest.*toegang/);
  // Nothing is sent until the popup's own button is used.
  assert.equal(screen.getByTestId('UserForm-confirm').getAttribute('type'), 'submit');
});

test('user-management › Cancel keeps the role', () => {
  show({ user: me, isSelf: true });
  fireEvent.change(roleSelect(), { target: { value: 'admin' } });
  fireEvent.click(screen.getByTestId('UserForm-save'));
  fireEvent.click(screen.getByTestId('UserForm-cancel'));
  assert.equal(popup().open, false);
  fireEvent.click(screen.getByTestId('UserForm-reset'));
  assert.equal([...roleSelect().options].find((o) => o.defaultSelected)?.value, 'superadmin');
});

test('user-management › Other saves need no warning', () => {
  show({ user: me, isSelf: true });
  fireEvent.change(nameInput(), { target: { value: 'Baasje' } });
  fireEvent.click(screen.getByTestId('UserForm-save'));
  assert.equal(popup().open, false);
});

test('lowering the role of another member needs no warning', () => {
  show({ user: me });
  fireEvent.change(roleSelect(), { target: { value: 'user' } });
  fireEvent.click(screen.getByTestId('UserForm-save'));
  assert.equal(popup().open, false);
});
