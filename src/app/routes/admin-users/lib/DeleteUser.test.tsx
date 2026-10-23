import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { fireEvent, render, screen, within } from '~testing/dom';
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

describe('user-management › Popup asks for confirmation', () => {
  test('the popup starts closed', () => {
    show();
    assert.equal(dialog().open, false);
  });

  describe('once opened', () => {
    beforeEach(() => open());

    test('it is open', () => {
      assert.equal(dialog().open, true);
    });

    test('the title names the user', () => {
      assert.ok(within(dialog()).getByTestId('DeleteUser-title').textContent?.includes('Jos'));
    });

    test('the confirm button submits and reads Verwijderen', () => {
      const confirm = within(dialog()).getByTestId('DeleteUser-confirm');
      assert.equal(confirm.textContent, 'Verwijderen');
      assert.equal(confirm.getAttribute('type'), 'submit');
    });

    test('the cancel button reads Annuleren', () => {
      assert.equal(within(dialog()).getByTestId('DeleteUser-cancel').textContent, 'Annuleren');
    });

    test('the form sends the delete intent', () => {
      assert.equal(document.querySelector<HTMLInputElement>('input[name=intent]')?.value, 'delete');
    });
  });
});

describe('user-management › Cancel closes the popup', () => {
  test('the popup closes', () => {
    open();
    fireEvent.click(within(dialog()).getByTestId('DeleteUser-cancel'));
    assert.equal(dialog().open, false);
  });
});

describe('DeleteUser backdrop', () => {
  beforeEach(() => open());

  test('a click inside leaves the popup open', () => {
    fireEvent.click(within(dialog()).getByTestId('DeleteUser-title'));
    assert.equal(dialog().open, true);
  });

  test('a click on the backdrop closes the popup', () => {
    fireEvent.click(dialog());
    assert.equal(dialog().open, false);
  });
});

describe('user-management › Popup explains the allowlist', () => {
  beforeEach(() => open());

  test('says the user can log in again while the email is on the allowlist', () => {
    assert.match(
      within(dialog()).getByTestId('DeleteUser-allowlist').textContent!,
      /opnieuw inloggen zolang het e-mailadres op de toegestane lijst staat/,
    );
  });

  test('links to the allowlist', () => {
    assert.equal(within(dialog()).getByTestId('DeleteUser-link').getAttribute('href'), 'https://access.example.com/');
  });
});

describe('user-management › Popup for your own record warns about losing access', () => {
  test('shows the warning', () => {
    open({ isSelf: true });
    assert.match(within(dialog()).getByTestId('DeleteUser-warning').textContent!, /verliest.*toegang/);
  });
});

describe('DeleteUser warning', () => {
  test('the popup for another record has no access warning', () => {
    open();
    assert.equal(screen.queryByTestId('DeleteUser-warning'), null);
  });
});

describe('DeleteUser disabled', () => {
  beforeEach(() => show({ disabledReason: 'De enige superadmin kan niet worden verwijderd' }));

  test('the button is disabled', () => {
    assert.equal(screen.getByTestId<HTMLButtonElement>('DeleteUser-open').disabled, true);
  });

  test('the button is described by the reason beside it', () => {
    assert.equal(screen.getByTestId('DeleteUser-open').getAttribute('aria-describedby'), screen.getByTestId('DeleteUser-reason').id);
  });
});

// Escape and the focus trap come from the browser's modal dialog, which happy-dom does not implement.
test.todo('Escape closes the delete popup');
