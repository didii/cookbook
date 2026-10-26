import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { beforeEach, describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { createUser, getUser } from '~app/shared/users.server';
import { cssFor } from '~testing/css';
import { precedes, render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/WelcomePageRoute';
import WelcomePage, { action, loader } from './WelcomePageRoute';

// Real loader and action against an in-memory D1; each test uses its own email.
const contextFor = (db: D1Database, email: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  return context;
};
const submit = (db: D1Database, email: string, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/welkom', { method: 'POST', body: new URLSearchParams(fields) }),
      context: contextFor(db, email),
    }),
  );
const open = async (db: D1Database, email: string, search = '') => {
  try {
    return await loader(
      fake<Route.LoaderArgs>({
        request: new Request(`http://localhost/welkom${search}`),
        context: contextFor(db, email),
      }),
    );
  } catch (thrown) {
    return thrown as Response; // a redirect is thrown
  }
};
// The Form needs a data router, so the screen is rendered inside one.
const show = (props: object) => {
  const router = createMemoryRouter([{ path: '/', element: <WelcomePage {...(props as Route.ComponentProps)} /> }]);
  return render(<RouterProvider router={router} />);
};
const countRows = async (db: D1Database, email: string) =>
  (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

describe('users › Submitting the calling name', () => {
  const email = 'jos@example.com';
  const send = (db: D1Database) => submit(db, email, { callingName: '  Jos ', returnUrl: '' }) as Promise<Response>;

  test('redirects to the home page', async ({ db }) => {
    const res = await send(db);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('Location'), '/');
  });

  test('stores the email and the trimmed calling name', async ({ db }) => {
    await send(db);
    const user = await getUser(db, email);
    assert.deepEqual([user?.email, user?.callingName], [email, 'Jos']);
  });

  test('stores the creation time', async ({ db }) => {
    await send(db);
    assert.match((await getUser(db, email))!.createdAt, /^\d{4}-\d\d-\d\dT/);
  });
});

describe('users › Continuing to the first requested page', () => {
  test('redirects to the requested page', async ({ db }) => {
    const res = (await submit(db, 'first@example.com', { callingName: 'Fien', returnUrl: '/recepten/soep?stap=2' })) as Response;
    assert.equal(res.headers.get('Location'), '/recepten/soep?stap=2');
  });
});

describe('users › Remembered page is not on this site', () => {
  for (const returnUrl of ['https://evil.test/', '//evil.test', '/\\evil.test', '/welkom']) {
    test(`${returnUrl} redirects to the home page`, async ({ db }) => {
      const res = (await submit(db, `away${returnUrl.length}@example.com`, { callingName: 'Ann', returnUrl })) as Response;
      assert.equal(res.headers.get('Location'), '/');
    });
  }

  // The same check guards the address the screen is opened with.
  test('the same check guards the address the screen is opened with', async ({ db }) => {
    await createUser(db, 'jos@example.com', 'Jos');
    const known = await open(db, 'jos@example.com', '?returnUrl=https%3A%2F%2Fevil.test');
    assert.equal((known as Response).headers.get('Location'), '/');
  });
});

describe('users › Blank calling name', () => {
  const blank = (db: D1Database, callingName: string) =>
    submit(db, 'blank@example.com', { callingName, returnUrl: '/recepten/soep' }) as Promise<{ data: { error: string }; init: { status: number } }>;

  for (const callingName of ['', '   ']) {
    describe(`calling name ${JSON.stringify(callingName)}`, () => {
      test('is refused with 400', async ({ db }) => {
        assert.equal((await blank(db, callingName)).init.status, 400);
      });

      test('gives an error', async ({ db }) => {
        assert.ok((await blank(db, callingName)).data.error);
      });
    });
  }

  test('nothing is stored', async ({ db }) => {
    await blank(db, '');
    await blank(db, '   ');
    assert.equal(await countRows(db, 'blank@example.com'), 0);
  });

  describe('the screen', () => {
    beforeEach(() => {
      show({ loaderData: { returnUrl: '/recepten/soep', email: 'a@example.com' }, actionData: { error: 'Vul in hoe we je noemen.', name: '' } });
    });

    test('stays and announces the error', () => {
      assert.equal(screen.getByTestId('WelcomePage-error').getAttribute('role'), 'alert');
    });
  });
});

describe('calling name length', () => {
  const tooLong = (db: D1Database) => submit(db, 'long@example.com', { callingName: 'x'.repeat(41) }) as Promise<{ init: { status: number } }>;

  test('a too long calling name is refused with 400', async ({ db }) => {
    assert.equal((await tooLong(db)).init.status, 400);
  });

  test('nothing is stored for a too long calling name', async ({ db }) => {
    await tooLong(db);
    assert.equal(await countRows(db, 'long@example.com'), 0);
  });
});

describe('users › Submitting twice', () => {
  const twice = async (db: D1Database) => {
    await submit(db, 'twice@example.com', { callingName: 'Eerste' });
    return (await submit(db, 'twice@example.com', { callingName: 'Tweede' })) as Response;
  };

  test('the second submit redirects', async ({ db }) => {
    assert.equal((await twice(db)).status, 302);
  });

  test('there is still one row', async ({ db }) => {
    await twice(db);
    assert.equal(await countRows(db, 'twice@example.com'), 1);
  });

  test('the first calling name is kept', async ({ db }) => {
    await twice(db);
    assert.equal((await getUser(db, 'twice@example.com'))?.callingName, 'Eerste');
  });
});

describe('welcome screen', () => {
  const loaded = (db: D1Database) => open(db, 'new@example.com', '?returnUrl=%2Frecepten%2Fsoep') as Promise<{ returnUrl: string; email: string }>;

  test('remembers the requested page', async ({ db }) => {
    assert.equal((await loaded(db)).returnUrl, '/recepten/soep');
  });

  test('shows the email of the member', async ({ db }) => {
    show({ loaderData: await loaded(db) });
    assert.equal(screen.getByTestId('WelcomePage-email').textContent, 'Voor new@example.com');
  });

  test('asks for the name with a label', async ({ db }) => {
    show({ loaderData: await loaded(db) });
    const label = screen.getByTestId<HTMLLabelElement>('WelcomePage-label');
    assert.equal(label.htmlFor, screen.getByTestId('WelcomePage-name').id);
  });

  test('carries the requested page in a hidden field', async ({ db }) => {
    const { container } = show({ loaderData: await loaded(db) });
    assert.equal(container.querySelector<HTMLInputElement>('input[name=returnUrl]')?.value, '/recepten/soep');
  });

  test('stores nothing yet', async ({ db }) => {
    await loaded(db);
    assert.equal(await countRows(db, 'new@example.com'), 0);
  });

  test('a known member opening the welcome screen is sent on', async ({ db }) => {
    await submit(db, 'known@example.com', { callingName: 'Kim' });
    assert.equal(((await open(db, 'KNOWN@example.com', '?returnUrl=%2Frecepten%2Fsoep')) as Response).headers.get('Location'), '/recepten/soep');
  });
});

// The emailed one-time code is Cloudflare Access, outside this code. What is ours: a new member is asked for nothing but a calling name.
describe('family-access › First visit by a new family member', () => {
  test('the screen asks for the calling name only', () => {
    const { container } = show({ loaderData: { returnUrl: '/', email: 'a@example.com' } });
    const fields = [...container.querySelectorAll('input:not([type=hidden])')];
    assert.equal(fields.length, 1);
    assert.equal(fields[0].getAttribute('name'), 'callingName');
  });

  test('the screen asks for no password or email', () => {
    const { container } = show({ loaderData: { returnUrl: '/', email: 'a@example.com' } });
    assert.equal(container.querySelector('[type=password], [type=email]'), null);
  });

  // Nothing but the calling name is needed to be taken in.
  test('the calling name alone is taken in', async ({ db }) => {
    const res = (await submit(db, 'nieuw@example.com', { callingName: 'Nel' })) as Response;
    assert.equal(res.status, 302);
    assert.equal((await getUser(db, 'nieuw@example.com'))?.callingName, 'Nel');
  });
});

describe('plaid-accent › Card has a plaid strip', () => {
  const card = () => {
    show({ loaderData: { returnUrl: '/', email: 'a@example.com' } });
    return screen.getByTestId('WelcomePage-card');
  };

  test('the card starts with a plaid layer', () => {
    assert.equal(card().firstElementChild, screen.getByTestId('Plaid-layer'));
  });

  test('the plaid comes before the fret', () => {
    card();
    assert.ok(precedes(screen.getByTestId('Plaid-layer'), screen.getByTestId('Fret-strip')));
  });

  test('the card has an ink border', async () => {
    assert.ok((await cssFor(card().className)).includes('border-color: var(--color-ink)'));
  });

  test('the page behind the card has no plaid', () => {
    card();
    assert.equal(screen.getAllByTestId('Plaid-layer').length, 1);
  });
});

describe('plaid-accent › Card is rounded', () => {
  const style = async () => {
    show({ loaderData: { returnUrl: '/', email: 'a@example.com' } });
    return cssFor(screen.getByTestId('WelcomePage-card').className);
  };

  test('the card has rounded corners', async () => {
    assert.ok((await style()).includes('border-radius: var(--radius-xl)'));
  });

  test('the card clips the strip and the tile band to its corners', async () => {
    assert.match(await style(), /overflow: hidden/);
  });
});

// Needs real layout.
test.todo('plaid-accent › Card on a narrow screen');
