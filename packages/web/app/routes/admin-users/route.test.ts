import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import type { Route } from './+types/route';
import { loader } from './route';

// Real loader against an in-memory D1.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
  for (const role of ['user', 'admin', 'superadmin'])
    await db.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?)').bind(`${role}@example.com`, role, role).run();
});

after(() => dispose());

const open = (email: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  return loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/beheer/gebruikers'), context }));
};
/** The status a refused call throws (a 403 is thrown as a response), or undefined when it succeeds. */
const refused = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (thrown) {
    return (thrown as { init?: { status?: number } }).init?.status;
  }
};

test('user-management › Superadmin opens the page', async () => {
  const { users, capped, limit } = await open('superadmin@example.com');
  assert.deepEqual([users.length, capped, limit], [3, false, 100]);
});

test('user-management › Admin opens the page', async () => {
  assert.equal(await refused(open('admin@example.com')), 403);
});

test('user-management › User opens the page', async () => {
  assert.equal(await refused(open('user@example.com')), 403);
  // Someone without a user row is no superadmin either.
  assert.equal(await refused(open('nobody@example.com')), 403);
});
