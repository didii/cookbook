import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { getUser } from '~/.server/users';
import type { Route } from './+types/route';
import Welcome, { action, loader } from './route';

// Real loader and action against an in-memory D1; each test uses its own email.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

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
  const router = createMemoryRouter([{ path: '/', element: <Welcome {...(props as Route.ComponentProps)} /> }]);
  return render(<RouterProvider router={router} />);
};
const countRows = async (email: string) => (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

test('users › Submitting the calling name', async () => {
  const res = (await submit('jos@example.com', { callingName: '  Jos ', returnUrl: '' })) as Response;
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/');
  const user = await getUser(db, 'jos@example.com');
  assert.deepEqual([user?.email, user?.callingName], ['jos@example.com', 'Jos']);
  assert.match(user!.createdAt, /^\d{4}-\d\d-\d\dT/);
});

test('users › Continuing to the first requested page', async () => {
  const res = (await submit('first@example.com', { callingName: 'Fien', returnUrl: '/recepten/soep?stap=2' })) as Response;
  assert.equal(res.headers.get('Location'), '/recepten/soep?stap=2');
});

test('users › Remembered page is not on this site', async () => {
  for (const returnUrl of ['https://evil.test/', '//evil.test', '/\\evil.test', '/welkom'])
    assert.equal(
      ((await submit(`away${returnUrl.length}@example.com`, { callingName: 'Ann', returnUrl })) as Response).headers.get('Location'),
      '/',
      returnUrl,
    );
  // The same check guards the address the screen is opened with.
  const known = await open('jos@example.com', '?returnUrl=https%3A%2F%2Fevil.test');
  assert.equal((known as Response).headers.get('Location'), '/');
});

test('users › Blank calling name', async () => {
  for (const callingName of ['', '   ']) {
    const res = (await submit('blank@example.com', { callingName, returnUrl: '/recepten/soep' })) as {
      data: { error: string };
      init: { status: number };
    };
    assert.equal(res.init.status, 400);
    assert.match(res.data.error, /Vul in/);
  }
  assert.equal(await countRows('blank@example.com'), 0);
  // The screen stays and says what is needed.
  show({ loaderData: { returnUrl: '/recepten/soep' }, actionData: { error: 'Vul in hoe we je noemen.', name: '' } });
  const alert = screen.getByTestId('Welcome-error');
  assert.equal(alert.getAttribute('role'), 'alert');
  assert.equal(alert.textContent, 'Vul in hoe we je noemen.');
});

test('a too long calling name is refused and nothing is stored', async () => {
  const res = (await submit('long@example.com', { callingName: 'x'.repeat(41) })) as { init: { status: number } };
  assert.equal(res.init.status, 400);
  assert.equal(await countRows('long@example.com'), 0);
});

test('users › Submitting twice', async () => {
  await submit('twice@example.com', { callingName: 'Eerste' });
  const again = (await submit('twice@example.com', { callingName: 'Tweede' })) as Response;
  assert.equal(again.status, 302);
  assert.equal(await countRows('twice@example.com'), 1);
  assert.equal((await getUser(db, 'twice@example.com'))?.callingName, 'Eerste');
});

test('the welcome screen asks for the name and remembers the page', async () => {
  const data = (await open('new@example.com', '?returnUrl=%2Frecepten%2Fsoep')) as { returnUrl: string };
  assert.equal(data.returnUrl, '/recepten/soep');
  const { container } = show({ loaderData: data });
  assert.ok(screen.getByTestId('Welcome-label'));
  assert.equal(container.querySelector<HTMLInputElement>('input[name=returnUrl]')?.value, '/recepten/soep');
  assert.equal(await countRows('new@example.com'), 0);
});

test('a known member opening the welcome screen is sent on', async () => {
  await submit('known@example.com', { callingName: 'Kim' });
  assert.equal(((await open('KNOWN@example.com', '?returnUrl=%2Frecepten%2Fsoep')) as Response).headers.get('Location'), '/recepten/soep');
});

// The emailed one-time code is Cloudflare Access, outside this code. What is ours: a new member is asked for nothing but a calling name.
test('family-access › First visit by a new family member', async () => {
  const { container } = show({ loaderData: { returnUrl: '/' } });
  const fields = [...container.querySelectorAll('input:not([type=hidden])')];
  assert.equal(fields.length, 1);
  assert.equal(fields[0].getAttribute('name'), 'callingName');
  assert.equal(container.querySelector('[type=password], [type=email]'), null);
  // Nothing but the calling name is needed to be taken in.
  const res = (await submit('nieuw@example.com', { callingName: 'Nel' })) as Response;
  assert.equal(res.status, 302);
  assert.equal((await getUser(db, 'nieuw@example.com'))?.callingName, 'Nel');
});
