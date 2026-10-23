import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { beforeEach, describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getUser } from '~app/shared/users.server';
import { redirectToWelcome } from '~app/shared/welcome.server';
import { test } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route } from './+types/AdminUserPageRoute';
import { action, loader } from './AdminUserPageRoute';

// Real loader and action against an in-memory D1, fresh for every test so none depends on another. `boss` and `other` are superadmins.
let db: D1Database;
const ids: Record<string, number> = {};

test.beforeEach(async ({ freshDb }) => {
  ({ db } = freshDb);
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

const contextFor = (as: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, CLOUDFLARE_ACCESS_URL: 'https://access.example.com/' }));
  context.set(userEmailContext, `${as}@example.com`);
  return context;
};
const open = (as: string, id: string | number) =>
  loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/x'), params: { id: String(id) }, context: contextFor(as) }));
/** What the action returns: `data()` has `init` and `data`, a redirect is a `Response` with `headers`. */
type Sent = { init?: { status?: number }; data?: unknown; headers?: Headers };
const post = (as: string, id: string | number, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/x', { method: 'POST', body: new URLSearchParams(fields) }),
      params: { id: String(id) },
      context: contextFor(as),
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
const stored = async (name: string) => getUser(db, `${name}@example.com`);

describe('user-management › Non-superadmin asks for an unknown user', () => {
  test('an admin asking for a missing id is refused with 403', async () => {
    assert.equal(await thrownStatus(open('admin', 9999)), 403);
  });

  test('an admin asking for an existing user is refused with 403', async () => {
    assert.equal(await thrownStatus(open('admin', ids.jos)), 403);
  });

  test('a user asking for a non-numeric id is refused with 403', async () => {
    assert.equal(await thrownStatus(open('user', 'abc')), 403);
  });
});

describe('user-management › Unknown user', () => {
  test('a missing id answers 404', async () => {
    assert.equal(await thrownStatus(open('boss', 9999)), 404);
  });

  test('a non-numeric id answers 404', async () => {
    assert.equal(await thrownStatus(open('boss', 'abc')), 404);
  });
});

describe('loader', () => {
  test('returns the user, whether they are the last superadmin and the allowlist link', async () => {
    const result = await open('boss', ids.jos);
    assert.deepEqual(result.user, { id: ids.jos, email: 'jos@example.com', callingName: 'jos', role: 'user' });
    assert.deepEqual([result.lastSuperadmin, result.isSelf, result.accessUrl], [false, false, 'https://access.example.com/']);
  });

  test('flags the own record as self', async () => {
    assert.equal((await open('boss', ids.boss)).isSelf, true);
  });

  test('an id of more than 9 digits is an unknown user', async () => {
    assert.equal(await thrownStatus(open('boss', '000000000001')), 404);
  });
});

describe('user-management › Non-superadmin saves a change', () => {
  test('an admin changing name and role is refused with 403', async () => {
    assert.equal(await thrownStatus(post('admin', ids.jos, { callingName: 'Hack', role: 'superadmin' })), 403);
  });

  test('a user changing the name is refused with 403', async () => {
    assert.equal(await thrownStatus(post('user', ids.jos, { callingName: 'Hack' })), 403);
  });

  test('the stored name and role stay as they were', async () => {
    await thrownStatus(post('admin', ids.jos, { callingName: 'Hack', role: 'superadmin' }));
    await thrownStatus(post('user', ids.jos, { callingName: 'Hack' }));
    assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['jos', 'user']);
  });
});

describe('user-management › Non-superadmin deletes a user', () => {
  test('is refused with 403', async () => {
    assert.equal(await thrownStatus(post('admin', ids.jos, { intent: 'delete' })), 403);
  });

  test('the user is kept', async () => {
    await thrownStatus(post('admin', ids.jos, { intent: 'delete' }));
    assert.notEqual(await stored('jos'), undefined);
  });
});

describe('user-management › Blank calling name', () => {
  test('answers 400 with the error message', async () => {
    const result = await post('boss', ids.jos, { callingName: '   ', role: 'admin' });
    assert.equal(result.init?.status, 400);
    assert.deepEqual(result.data, { error: 'Vul een roepnaam in.' });
  });

  test('the stored name and role stay as they were', async () => {
    await post('boss', ids.jos, { callingName: '   ', role: 'admin' });
    assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['jos', 'user']);
  });
});

describe('user-management › Unknown role', () => {
  test('answers 400', async () => {
    const result = await post('boss', ids.jos, { callingName: 'jos', role: 'owner' });
    assert.equal(result.init?.status, 400);
  });

  test('the role stays as it was', async () => {
    await post('boss', ids.jos, { callingName: 'jos', role: 'owner' });
    assert.equal((await stored('jos'))?.role, 'user');
  });
});

describe('action save', () => {
  test('shows the change as saved', async () => {
    const result = await post('boss', ids.jos, { callingName: '  Josje ', role: 'admin' });
    assert.deepEqual(result.data, { saved: true });
  });

  test('stores the trimmed calling name and role', async () => {
    await post('boss', ids.jos, { callingName: '  Josje ', role: 'admin' });
    assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['Josje', 'admin']);
  });
});

describe('user-management › Missing role keeps the role', () => {
  test('the name changes and the role stays', async () => {
    await db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(ids.jos).run();
    await post('boss', ids.jos, { callingName: 'Josje' });
    assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['Josje', 'admin']);
  });
});

describe('user-management › Delete own record', () => {
  test('redirects to the home page', async () => {
    const response = await post('other', ids.other, { intent: 'delete' });
    assert.equal(response.headers!.get('Location'), '/');
  });

  test('removes the record', async () => {
    await post('other', ids.other, { intent: 'delete' });
    assert.equal(await stored('other'), undefined);
  });
});

describe('action delete', () => {
  const removeOtherSuperadmin = () => db.prepare('DELETE FROM users WHERE id = ?').bind(ids.other).run();

  describe('a user deleted in the meantime', () => {
    beforeEach(async () => {
      await post('boss', ids.jos, { intent: 'delete' });
    });

    test('answers 404 to a second delete, not the superadmin refusal', async () => {
      assert.equal(await thrownStatus(post('boss', ids.jos, { intent: 'delete' })), 404);
    });

    test('answers 404 to a save', async () => {
      assert.equal(await thrownStatus(post('boss', ids.jos, { callingName: 'jos' })), 404);
    });
  });

  describe('the sole superadmin', () => {
    beforeEach(async () => {
      await removeOtherSuperadmin();
    });

    test('is flagged as last by the loader', async () => {
      assert.equal((await open('boss', ids.boss)).lastSuperadmin, true);
    });

    test('cannot be demoted through the action', async () => {
      assert.equal((await post('boss', ids.boss, { callingName: 'boss', role: 'admin' })).init?.status, 400);
      assert.equal((await stored('boss'))?.role, 'superadmin');
    });

    test('cannot be deleted through the action', async () => {
      assert.equal((await post('boss', ids.boss, { intent: 'delete' })).init?.status, 400);
      assert.notEqual(await stored('boss'), undefined);
    });
  });

  describe('another user', () => {
    test('returns to the list', async () => {
      const response = await post('boss', ids.jos, { intent: 'delete' });
      assert.equal(response.headers!.get('Location'), '/beheer/gebruikers');
    });

    test('is removed', async () => {
      await post('boss', ids.jos, { intent: 'delete' });
      assert.equal(await stored('jos'), undefined);
    });
  });
});

describe('user-management › Demote self while another superadmin exists', () => {
  beforeEach(async () => {
    await db.prepare("UPDATE users SET role = 'superadmin' WHERE email = 'admin@example.com'").run();
  });

  test('redirects to the home page', async () => {
    const response = await post('admin', ids.admin, { callingName: 'admin', role: 'admin' });
    assert.equal(response.headers!.get('Location'), '/');
  });

  test('stores the lower role', async () => {
    await post('admin', ids.admin, { callingName: 'admin', role: 'admin' });
    assert.equal((await stored('admin'))?.role, 'admin');
  });
});

describe('user-management › Deleted member returns', () => {
  // Without a user row the member is sent to the welcome screen, which asks for the calling name again.
  test('is sent to the welcome screen', async () => {
    await post('boss', ids.jos, { intent: 'delete' });
    const welcome = redirectToWelcome(await stored('jos'), new URL('http://localhost/'));
    assert.match(welcome?.headers.get('Location') ?? '', /^\/welkom/);
  });
});
