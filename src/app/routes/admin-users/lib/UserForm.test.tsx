import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
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

describe('user-management › Selecting a user', () => {
  beforeEach(() => show());

  test('shows the email as plain text', () => {
    assert.equal(screen.getByTestId('UserForm-email').textContent, 'jos@example.com');
    assert.equal(screen.getByTestId('UserForm-email').tagName, 'SPAN');
  });

  test('fills the calling name and role', () => {
    assert.deepEqual([nameInput().value, roleSelect().value], ['Jos', 'admin']);
  });

  test('offers the three roles', () => {
    assert.deepEqual(
      [...roleSelect().options].map((o) => o.value),
      ['user', 'admin', 'superadmin'],
    );
  });
});

describe('user-management › Reset the form', () => {
  beforeEach(() => {
    show();
    fireEvent.change(nameInput(), { target: { value: 'Josje' } });
    fireEvent.change(roleSelect(), { target: { value: 'user' } });
  });

  test('the edits show before the reset', () => {
    assert.deepEqual([nameInput().value, roleSelect().value], ['Josje', 'user']);
  });

  test('the name goes back to the saved one', () => {
    fireEvent.click(screen.getByTestId('UserForm-reset'));
    assert.equal(nameInput().value, 'Jos');
  });

  // Happy-dom does not reset a <select>; a browser restores it from the option React marked as default.
  test('the role select is marked to go back to the saved role', () => {
    fireEvent.click(screen.getByTestId('UserForm-reset'));
    assert.equal([...roleSelect().options].find((o) => o.defaultSelected)?.value, 'admin');
  });
});

describe('user-management › Sole superadmin selects own record', () => {
  beforeEach(() => show({ user: { ...jos, role: 'superadmin' }, lastSuperadmin: true }));

  test('the role cannot be changed', () => {
    assert.equal(roleSelect().disabled, true);
  });

  test('the calling name can be changed', () => {
    assert.equal(nameInput().disabled, false);
  });

  test('the delete button is disabled with a reason', () => {
    assert.equal(screen.getByTestId<HTMLButtonElement>('DeleteUser-open').disabled, true);
    assert.equal(screen.getByTestId('DeleteUser-reason').textContent, 'De enige superadmin kan niet worden verwijderd');
  });

  test('the role explains why it is locked', () => {
    assert.equal(screen.getByTestId('UserForm-reason').textContent, 'De rol van de enige superadmin kan niet worden gewijzigd');
  });
});

describe('user-management › Reason next to a disabled control', () => {
  test('the disabled role select is described by the reason', () => {
    show({ user: { ...jos, role: 'superadmin' }, lastSuperadmin: true });
    const reason = screen.getByTestId('UserForm-reason');
    assert.equal(roleSelect().getAttribute('aria-describedby'), reason.id);
  });
});

describe('UserForm errors', () => {
  beforeEach(() => show({ error: 'Vul een roepnaam in.', refused: 'Onbekende rol.' }));

  test('the blank-name message is shown', () => {
    assert.equal(screen.getByTestId('UserForm-error').textContent, 'Vul een roepnaam in.');
  });

  test('the name field is marked invalid', () => {
    assert.equal(nameInput().getAttribute('aria-invalid'), 'true');
  });

  test('a refused change is shown', () => {
    assert.equal(screen.getByTestId('UserForm-refused').textContent, 'Onbekende rol.');
  });
});

const me = { ...jos, role: 'superadmin' as Role };
const popup = () => screen.getByTestId<HTMLDialogElement>('UserForm-warning');
// A save that is not held back by the popup would really submit; the router cannot do that in happy-dom, and these tests only look at the popup.
document.addEventListener('submit', (e) => e.stopPropagation(), { capture: true });

describe('user-management › Popup warns about losing access', () => {
  beforeEach(() => {
    show({ user: me, isSelf: true });
    fireEvent.change(roleSelect(), { target: { value: 'admin' } });
    fireEvent.click(screen.getByTestId('UserForm-save'));
  });

  test('the popup opens', () => {
    assert.equal(popup().open, true);
  });

  test('the popup warns about losing access', () => {
    assert.match(popup().textContent!, /verliest.*toegang/);
  });

  // Nothing is sent until the popup's own button is used.
  test('the popup has its own submit button', () => {
    assert.equal(screen.getByTestId('UserForm-confirm').getAttribute('type'), 'submit');
  });
});

describe('user-management › Cancel keeps the role', () => {
  beforeEach(() => {
    show({ user: me, isSelf: true });
    fireEvent.change(roleSelect(), { target: { value: 'admin' } });
    fireEvent.click(screen.getByTestId('UserForm-save'));
    fireEvent.click(screen.getByTestId('UserForm-cancel'));
  });

  test('the popup closes', () => {
    assert.equal(popup().open, false);
  });

  test('the role goes back to the saved one on reset', () => {
    fireEvent.click(screen.getByTestId('UserForm-reset'));
    assert.equal([...roleSelect().options].find((o) => o.defaultSelected)?.value, 'superadmin');
  });
});

describe('user-management › Other saves need no warning', () => {
  test('saving only a new name opens no popup', () => {
    show({ user: me, isSelf: true });
    fireEvent.change(nameInput(), { target: { value: 'Baasje' } });
    fireEvent.click(screen.getByTestId('UserForm-save'));
    assert.equal(popup().open, false);
  });
});

describe('UserForm warning', () => {
  test('lowering the role of another member needs no warning', () => {
    show({ user: me });
    fireEvent.change(roleSelect(), { target: { value: 'user' } });
    fireEvent.click(screen.getByTestId('UserForm-save'));
    assert.equal(popup().open, false);
  });
});
