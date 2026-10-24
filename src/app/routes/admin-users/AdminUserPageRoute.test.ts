import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/AdminUserPageRoute';
import { action, loader } from './AdminUserPageRoute';

// Real loader and action against an in-memory D1, emptied and reseeded for every test so none depends on another. `boss` and `other` are superadmins.
const ids: Record<string, number> = {};

test.beforeEach(async ({ db }) => {
  for (const [name, role] of [
    ['user', 'user'],
    ['admin', 'admin'],
    ['boss', 'superadmin'],
    ['other', 'superadmin'],
    ['jos', 'user'],
  ]) {
    ids[name] = (await db
      .prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?) RETURNING id')
      .bind(`${name}@example.com`, name, role)
      .first<{ id: number }>())!.id;
  }
});

const contextFor = (db: D1Database, as: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, CLOUDFLARE_ACCESS_URL: 'https://access.example.com/' }));
  context.set(userEmailContext, `${as}@example.com`);
  return context;
};
const open = (db: D1Database, as: string, id: string | number) =>
  loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/x'), params: { id: String(id) }, context: contextFor(db, as) }));
/** What the action returns: `data()` has `init` and `data`, a redirect is a `Response` with `headers`. */
type Sent = { init?: { status?: number }; data?: unknown; headers?: Headers };
const post = (db: D1Database, as: string, id: string | number, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/x', { method: 'POST', body: new URLSearchParams(fields) }),
      params: { id: String(id) },
      context: contextFor(db, as),
    }),
  ) as unknown as Promise<Sent>;
/** The status a call throws (a 403 or 404 response), or undefined when it succeeds. */
const thrownStatus = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (thrown) {
    return (thrown as { init?: { status?: number } }).init?.status;
  }
};
const stored = async (db: D1Database, name: string) => getUser(db, `${name}@example.com`);

describe('user-management › Non-superadmin asks for an unknown user', () => {
  test('an admin asking for a missing id is refused with 403', async ({ db }) => {
    assert.equal(await thrownStatus(open(db, 'admin', 9999)), 403);
  });

  test('an admin asking for an existing user is refused with 403', async ({ db }) => {
    assert.equal(await thrownStatus(open(db, 'admin', ids.jos)), 403);
  });

  test('a user asking for a non-numeric id is refused with 403', async ({ db }) => {
    assert.equal(await thrownStatus(open(db, 'user', 'abc')), 403);
  });
});

describe('user-management › Unknown user', () => {
  test('a missing id answers 404', async ({ db }) => {
    assert.equal(await thrownStatus(open(db, 'boss', 9999)), 404);
  });

  test('a non-numeric id answers 404', async ({ db }) => {
    assert.equal(await thrownStatus(open(db, 'boss', 'abc')), 404);
  });
});

describe('loader', () => {
  test('returns the user, whether they are the last superadmin and the allowlist link', async ({ db }) => {
    const result = await open(db, 'boss', ids.jos);
    assert.deepEqual(result.user, { id: ids.jos, email: 'jos@example.com', callingName: 'jos', role: 'user' });
    assert.deepEqual([result.lastSuperadmin, result.isSelf, result.accessUrl], [false, false, 'https://access.example.com/']);
  });

  test('flags the own record as self', async ({ db }) => {
    assert.equal((await open(db, 'boss', ids.boss)).isSelf, true);
  });

  test('an id of more than 9 digits is an unknown user', async ({ db }) => {
    assert.equal(await thrownStatus(open(db, 'boss', '000000000001')), 404);
  });
});

describe('user-management › Non-superadmin saves a change', () => {
  test('an admin changing name and role is refused with 403', async ({ db }) => {
    assert.equal(await thrownStatus(post(db, 'admin', ids.jos, { callingName: 'Hack', role: 'superadmin' })), 403);
  });

  test('a user changing the name is refused with 403', async ({ db }) => {
    assert.equal(await thrownStatus(post(db, 'user', ids.jos, { callingName: 'Hack' })), 403);
  });

  test('the stored name and role stay as they were', async ({ db }) => {
    await thrownStatus(post(db, 'admin', ids.jos, { callingName: 'Hack', role: 'superadmin' }));
    await thrownStatus(post(db, 'user', ids.jos, { callingName: 'Hack' }));
    assert.deepEqual([(await stored(db, 'jos'))?.callingName, (await stored(db, 'jos'))?.role], ['jos', 'user']);
  });
});

describe('user-management › Non-superadmin deletes a user', () => {
  test('is refused with 403', async ({ db }) => {
    assert.equal(await thrownStatus(post(db, 'admin', ids.jos, { intent: 'delete' })), 403);
  });

  test('the user is kept', async ({ db }) => {
    await thrownStatus(post(db, 'admin', ids.jos, { intent: 'delete' }));
    assert.notEqual(await stored(db, 'jos'), undefined);
  });
});

describe('user-management › Blank calling name', () => {
  test('answers 400 with the error message', async ({ db }) => {
    const result = await post(db, 'boss', ids.jos, { callingName: '   ', role: 'admin' });
    assert.equal(result.init?.status, 400);
    assert.deepEqual(result.data, { error: 'Vul een roepnaam in.' });
  });

  test('the stored name and role stay as they were', async ({ db }) => {
    await post(db, 'boss', ids.jos, { callingName: '   ', role: 'admin' });
    assert.deepEqual([(await stored(db, 'jos'))?.callingName, (await stored(db, 'jos'))?.role], ['jos', 'user']);
  });
});

describe('user-management › Unknown role', () => {
  test('answers 400', async ({ db }) => {
    const result = await post(db, 'boss', ids.jos, { callingName: 'jos', role: 'owner' });
    assert.equal(result.init?.status, 400);
  });

  test('the role stays as it was', async ({ db }) => {
    await post(db, 'boss', ids.jos, { callingName: 'jos', role: 'owner' });
    assert.equal((await stored(db, 'jos'))?.role, 'user');
  });
});

describe('action save', () => {
  test('shows the change as saved', async ({ db }) => {
    const result = await post(db, 'boss', ids.jos, { callingName: '  Josje ', role: 'admin' });
    assert.deepEqual(result.data, { saved: true });
  });

  test('stores the trimmed calling name and role', async ({ db }) => {
    await post(db, 'boss', ids.jos, { callingName: '  Josje ', role: 'admin' });
    assert.deepEqual([(await stored(db, 'jos'))?.callingName, (await stored(db, 'jos'))?.role], ['Josje', 'admin']);
  });
});

describe('user-management › Missing role keeps the role', () => {
  test('the name changes and the role stays', async ({ db }) => {
    await db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(ids.jos).run();
    await post(db, 'boss', ids.jos, { callingName: 'Josje' });
    assert.deepEqual([(await stored(db, 'jos'))?.callingName, (await stored(db, 'jos'))?.role], ['Josje', 'admin']);
  });
});

describe('user-management › Delete own record', () => {
  test('redirects to the home page', async ({ db }) => {
    const response = await post(db, 'other', ids.other, { intent: 'delete' });
    assert.equal(response.headers!.get('Location'), '/');
  });

  test('removes the record', async ({ db }) => {
    await post(db, 'other', ids.other, { intent: 'delete' });
    assert.equal(await stored(db, 'other'), undefined);
  });
});

describe('action delete', () => {
  const removeOtherSuperadmin = (db: D1Database) => db.prepare('DELETE FROM users WHERE id = ?').bind(ids.other).run();

  describe('a user deleted in the meantime', () => {
    test.beforeEach(async ({ db }) => {
      await post(db, 'boss', ids.jos, { intent: 'delete' });
    });

    test('answers 404 to a second delete, not the superadmin refusal', async ({ db }) => {
      assert.equal(await thrownStatus(post(db, 'boss', ids.jos, { intent: 'delete' })), 404);
    });

    test('answers 404 to a save', async ({ db }) => {
      assert.equal(await thrownStatus(post(db, 'boss', ids.jos, { callingName: 'jos' })), 404);
    });
  });

  describe('the sole superadmin', () => {
    test.beforeEach(async ({ db }) => {
      await removeOtherSuperadmin(db);
    });

    test('is flagged as last by the loader', async ({ db }) => {
      assert.equal((await open(db, 'boss', ids.boss)).lastSuperadmin, true);
    });

    test('cannot be demoted through the action', async ({ db }) => {
      assert.equal((await post(db, 'boss', ids.boss, { callingName: 'boss', role: 'admin' })).init?.status, 400);
      assert.equal((await stored(db, 'boss'))?.role, 'superadmin');
    });

    test('cannot be deleted through the action', async ({ db }) => {
      assert.equal((await post(db, 'boss', ids.boss, { intent: 'delete' })).init?.status, 400);
      assert.notEqual(await stored(db, 'boss'), undefined);
    });
  });

  describe('another user', () => {
    test('returns to the list', async ({ db }) => {
      const response = await post(db, 'boss', ids.jos, { intent: 'delete' });
      assert.equal(response.headers!.get('Location'), '/beheer/gebruikers');
    });

    test('is removed', async ({ db }) => {
      await post(db, 'boss', ids.jos, { intent: 'delete' });
      assert.equal(await stored(db, 'jos'), undefined);
    });
  });
});

describe('user-management › Demote self while another superadmin exists', () => {
  test.beforeEach(async ({ db }) => {
    await db.prepare("UPDATE users SET role = 'superadmin' WHERE email = 'admin@example.com'").run();
  });

  test('redirects to the home page', async ({ db }) => {
    const response = await post(db, 'admin', ids.admin, { callingName: 'admin', role: 'admin' });
    assert.equal(response.headers!.get('Location'), '/');
  });

  test('stores the lower role', async ({ db }) => {
    await post(db, 'admin', ids.admin, { callingName: 'admin', role: 'admin' });
    assert.equal((await stored(db, 'admin'))?.role, 'admin');
  });
});

// The welcome redirect for a member without a user row happens in the shared welcome check before any route runs, not in this route's loader or action.
test.todo('user-management › Deleted member returns');
