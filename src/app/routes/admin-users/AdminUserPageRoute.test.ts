import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~app/.server/context';
import { getUser } from '~app/.server/users';
import { redirectToWelcome } from '~app/.server/welcome';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import { action, loader } from './AdminUserPageRoute';
import type { Route } from './user/+types/route';

// Real loader and action against an in-memory D1, fresh for every test so none depends on another. `boss` and `other` are superadmins.
let db: D1Database;
let dispose: () => Promise<void>;
const ids: Record<string, number> = {};

beforeEach(async () => {
  ({ db, dispose } = await createTestDb());
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

afterEach(() => dispose());

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

test('user-management › Non-superadmin asks for an unknown user', async () => {
  assert.equal(await thrownStatus(open('admin', 9999)), 403);
  assert.equal(await thrownStatus(open('admin', ids.jos)), 403);
  assert.equal(await thrownStatus(open('user', 'abc')), 403);
});

test('user-management › Unknown user', async () => {
  assert.equal(await thrownStatus(open('boss', 9999)), 404);
  assert.equal(await thrownStatus(open('boss', 'abc')), 404);
});

test('the loader returns the user, whether they are the last superadmin and the allowlist link', async () => {
  const result = await open('boss', ids.jos);
  assert.deepEqual(result.user, { id: ids.jos, email: 'jos@example.com', callingName: 'jos', role: 'user' });
  assert.deepEqual([result.lastSuperadmin, result.isSelf, result.accessUrl], [false, false, 'https://access.example.com/']);
  assert.equal((await open('boss', ids.boss)).isSelf, true);
});

test('user-management › Non-superadmin saves a change', async () => {
  assert.equal(await thrownStatus(post('admin', ids.jos, { callingName: 'Hack', role: 'superadmin' })), 403);
  assert.equal(await thrownStatus(post('user', ids.jos, { callingName: 'Hack' })), 403);
  assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['jos', 'user']);
});

test('user-management › Non-superadmin deletes a user', async () => {
  assert.equal(await thrownStatus(post('admin', ids.jos, { intent: 'delete' })), 403);
  assert.notEqual(await stored('jos'), undefined);
});

test('user-management › Blank calling name', async () => {
  const result = await post('boss', ids.jos, { callingName: '   ', role: 'admin' });
  assert.equal(result.init?.status, 400);
  assert.deepEqual(result.data, { error: 'Vul een roepnaam in.' });
  assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['jos', 'user']);
});

test('user-management › Unknown role', async () => {
  const result = await post('boss', ids.jos, { callingName: 'jos', role: 'owner' });
  assert.equal(result.init?.status, 400);
  assert.equal((await stored('jos'))?.role, 'user');
});

test('saving stores the trimmed calling name and role, and shows it as saved', async () => {
  const result = await post('boss', ids.jos, { callingName: '  Josje ', role: 'admin' });
  assert.deepEqual(result.data, { saved: true });
  assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['Josje', 'admin']);
});

test('user-management › Missing role keeps the role', async () => {
  await db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(ids.jos).run();
  await post('boss', ids.jos, { callingName: 'Josje' });
  assert.deepEqual([(await stored('jos'))?.callingName, (await stored('jos'))?.role], ['Josje', 'admin']);
});

test('user-management › Delete own record', async () => {
  const response = await post('other', ids.other, { intent: 'delete' });
  assert.equal(response.headers!.get('Location'), '/');
  assert.equal(await stored('other'), undefined);
});

test('a user deleted in the meantime answers 404, not the superadmin refusal', async () => {
  await post('boss', ids.jos, { intent: 'delete' });
  assert.equal(await thrownStatus(post('boss', ids.jos, { intent: 'delete' })), 404);
  assert.equal(await thrownStatus(post('boss', ids.jos, { callingName: 'jos' })), 404);
});

test('an id of more than 9 digits is an unknown user', async () => {
  assert.equal(await thrownStatus(open('boss', '000000000001')), 404);
});

const removeOtherSuperadmin = () => db.prepare('DELETE FROM users WHERE id = ?').bind(ids.other).run();

test('the sole superadmin is flagged as last by the loader', async () => {
  await removeOtherSuperadmin();
  assert.equal((await open('boss', ids.boss)).lastSuperadmin, true);
});

test('the sole superadmin cannot be demoted through the action', async () => {
  await removeOtherSuperadmin();
  assert.equal((await post('boss', ids.boss, { callingName: 'boss', role: 'admin' })).init?.status, 400);
  assert.equal((await stored('boss'))?.role, 'superadmin');
});

test('the sole superadmin cannot be deleted through the action', async () => {
  await removeOtherSuperadmin();
  assert.equal((await post('boss', ids.boss, { intent: 'delete' })).init?.status, 400);
  assert.notEqual(await stored('boss'), undefined);
});

test('deleting another user returns to the list', async () => {
  const response = await post('boss', ids.jos, { intent: 'delete' });
  assert.equal(response.headers!.get('Location'), '/beheer/gebruikers');
  assert.equal(await stored('jos'), undefined);
});

test('user-management › Demote self while another superadmin exists', async () => {
  await db.prepare("UPDATE users SET role = 'superadmin' WHERE email = 'admin@example.com'").run();
  const response = await post('admin', ids.admin, { callingName: 'admin', role: 'admin' });
  assert.equal(response.headers!.get('Location'), '/');
  assert.equal((await stored('admin'))?.role, 'admin');
});

test('user-management › Deleted member returns', async () => {
  // Without a user row the member is sent to the welcome screen, which asks for the calling name again.
  await post('boss', ids.jos, { intent: 'delete' });
  const welcome = redirectToWelcome(await stored('jos'), new URL('http://localhost/'));
  assert.match(welcome?.headers.get('Location') ?? '', /^\/welkom/);
});
