import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getUser } from '~app/shared/users.server';
import { createTestDb } from '~testing/db';
import { render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import type { Route } from './+types/WelcomePageRoute';
import WelcomePage, { action, loader } from './WelcomePageRoute';

// Real loader and action against an in-memory D1; each test uses its own email.
let db: D1Database;
let dispose: () => Promise<void>;

beforeAll(async () => {
  ({ db, dispose } = await createTestDb());
});

afterAll(() => dispose());

const contextFor = (email: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  return context;
};
const submit = (email: string, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/welkom', { method: 'POST', body: new URLSearchParams(fields) }),
      context: contextFor(email),
    }),
  );
const open = async (email: string, search = '') => {
  try {
    return await loader(
      fake<Route.LoaderArgs>({
        request: new Request(`http://localhost/welkom${search}`),
        context: contextFor(email),
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
const countRows = async (email: string) => (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

describe('users › Submitting the calling name', () => {
  const email = 'jos@example.com';
  const send = () => submit(email, { callingName: '  Jos ', returnUrl: '' }) as Promise<Response>;

  test('redirects to the home page', async () => {
    const res = await send();
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('Location'), '/');
  });

  test('stores the email and the trimmed calling name', async () => {
    await send();
    const user = await getUser(db, email);
    assert.deepEqual([user?.email, user?.callingName], [email, 'Jos']);
  });

  test('stores the creation time', async () => {
    await send();
    assert.match((await getUser(db, email))!.createdAt, /^\d{4}-\d\d-\d\dT/);
  });
});

describe('users › Continuing to the first requested page', () => {
  test('redirects to the requested page', async () => {
    const res = (await submit('first@example.com', { callingName: 'Fien', returnUrl: '/recepten/soep?stap=2' })) as Response;
    assert.equal(res.headers.get('Location'), '/recepten/soep?stap=2');
  });
});

describe('users › Remembered page is not on this site', () => {
  for (const returnUrl of ['https://evil.test/', '//evil.test', '/\\evil.test', '/welkom']) {
    test(`${returnUrl} redirects to the home page`, async () => {
      const res = (await submit(`away${returnUrl.length}@example.com`, { callingName: 'Ann', returnUrl })) as Response;
      assert.equal(res.headers.get('Location'), '/');
    });
  }

  // The same check guards the address the screen is opened with.
  test('the same check guards the address the screen is opened with', async () => {
    const known = await open('jos@example.com', '?returnUrl=https%3A%2F%2Fevil.test');
    assert.equal((known as Response).headers.get('Location'), '/');
  });
});

describe('users › Blank calling name', () => {
  const blank = (callingName: string) =>
    submit('blank@example.com', { callingName, returnUrl: '/recepten/soep' }) as Promise<{ data: { error: string }; init: { status: number } }>;

  for (const callingName of ['', '   ']) {
    describe(`calling name ${JSON.stringify(callingName)}`, () => {
      test('is refused with 400', async () => {
        assert.equal((await blank(callingName)).init.status, 400);
      });

      test('asks to fill in the name', async () => {
        assert.match((await blank(callingName)).data.error, /Vul in/);
      });
    });
  }

  test('nothing is stored', async () => {
    await blank('');
    await blank('   ');
    assert.equal(await countRows('blank@example.com'), 0);
  });

  describe('the screen', () => {
    beforeEach(() => {
      show({ loaderData: { returnUrl: '/recepten/soep' }, actionData: { error: 'Vul in hoe we je noemen.', name: '' } });
    });

    test('stays and announces the error', () => {
      assert.equal(screen.getByTestId('WelcomePage-error').getAttribute('role'), 'alert');
    });

    test('says what is needed', () => {
      assert.equal(screen.getByTestId('WelcomePage-error').textContent, 'Vul in hoe we je noemen.');
    });
  });
});

describe('calling name length', () => {
  const tooLong = () => submit('long@example.com', { callingName: 'x'.repeat(41) }) as Promise<{ init: { status: number } }>;

  test('a too long calling name is refused with 400', async () => {
    assert.equal((await tooLong()).init.status, 400);
  });

  test('nothing is stored for a too long calling name', async () => {
    await tooLong();
    assert.equal(await countRows('long@example.com'), 0);
  });
});

describe('users › Submitting twice', () => {
  const twice = async () => {
    await submit('twice@example.com', { callingName: 'Eerste' });
    return (await submit('twice@example.com', { callingName: 'Tweede' })) as Response;
  };

  test('the second submit redirects', async () => {
    assert.equal((await twice()).status, 302);
  });

  test('there is still one row', async () => {
    await twice();
    assert.equal(await countRows('twice@example.com'), 1);
  });

  test('the first calling name is kept', async () => {
    await twice();
    assert.equal((await getUser(db, 'twice@example.com'))?.callingName, 'Eerste');
  });
});

describe('welcome screen', () => {
  const loaded = () => open('new@example.com', '?returnUrl=%2Frecepten%2Fsoep') as Promise<{ returnUrl: string }>;

  test('remembers the requested page', async () => {
    assert.equal((await loaded()).returnUrl, '/recepten/soep');
  });

  test('asks for the name with a label', async () => {
    show({ loaderData: await loaded() });
    const label = screen.getByTestId<HTMLLabelElement>('WelcomePage-label');
    assert.equal(label.textContent?.trim(), 'Hoe noemen we je?');
    assert.equal(label.htmlFor, screen.getByTestId('WelcomePage-name').id);
  });

  test('carries the requested page in a hidden field', async () => {
    const { container } = show({ loaderData: await loaded() });
    assert.equal(container.querySelector<HTMLInputElement>('input[name=returnUrl]')?.value, '/recepten/soep');
  });

  test('stores nothing yet', async () => {
    await loaded();
    assert.equal(await countRows('new@example.com'), 0);
  });

  test('a known member opening the welcome screen is sent on', async () => {
    await submit('known@example.com', { callingName: 'Kim' });
    assert.equal(((await open('KNOWN@example.com', '?returnUrl=%2Frecepten%2Fsoep')) as Response).headers.get('Location'), '/recepten/soep');
  });
});

// The emailed one-time code is Cloudflare Access, outside this code. What is ours: a new member is asked for nothing but a calling name.
describe('family-access › First visit by a new family member', () => {
  test('the screen asks for the calling name only', () => {
    const { container } = show({ loaderData: { returnUrl: '/' } });
    const fields = [...container.querySelectorAll('input:not([type=hidden])')];
    assert.equal(fields.length, 1);
    assert.equal(fields[0].getAttribute('name'), 'callingName');
  });

  test('the screen asks for no password or email', () => {
    const { container } = show({ loaderData: { returnUrl: '/' } });
    assert.equal(container.querySelector('[type=password], [type=email]'), null);
  });

  // Nothing but the calling name is needed to be taken in.
  test('the calling name alone is taken in', async () => {
    const res = (await submit('nieuw@example.com', { callingName: 'Nel' })) as Response;
    assert.equal(res.status, 302);
    assert.equal((await getUser(db, 'nieuw@example.com'))?.callingName, 'Nel');
  });
});
