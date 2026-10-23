import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { test } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route } from './+types/AdminUsersPageRoute';
import { loader } from './AdminUsersPageRoute';

// Real loader against an in-memory D1.
let db: D1Database;

test.beforeAll(async ({ testDb }) => {
  ({ db } = testDb);
  for (const role of ['user', 'admin', 'superadmin'])
    await db.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?)').bind(`${role}@example.com`, role, role).run();
});

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

describe('user-management › Superadmin opens the page', () => {
  test('lists all users, uncapped at the limit of 100', async () => {
    const { users, capped, limit } = await open('superadmin@example.com');
    assert.deepEqual([users.length, capped, limit], [3, false, 100]);
  });
});

describe('user-management › Admin opens the page', () => {
  test('is refused with 403', async () => {
    assert.equal(await refused(open('admin@example.com')), 403);
  });
});

describe('user-management › User opens the page', () => {
  test('is refused with 403', async () => {
    assert.equal(await refused(open('user@example.com')), 403);
  });

  // Someone without a user row is no superadmin either.
  test('someone without a user row is refused with 403', async () => {
    assert.equal(await refused(open('nobody@example.com')), 403);
  });
});
