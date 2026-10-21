import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { createUser, getUser } from './users';

let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const rows = async (email: string) => (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

test('an unknown email has no user', async () => {
  assert.equal(await getUser(db, 'nobody@example.com'), undefined);
});

test('a created user is found with name and creation time', async () => {
  await createUser(db, 'jos@example.com', 'Jos');
  const user = await getUser(db, 'jos@example.com');
  assert.deepEqual([user?.email, user?.callingName], ['jos@example.com', 'Jos']);
  assert.match(user!.createdAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
});

test('users › New member is a user', async () => {
  await createUser(db, 'new@example.com', 'Nieuw');
  assert.equal((await getUser(db, 'new@example.com'))?.role, 'user');
});

test('users › Existing member is a user', async () => {
  await db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind('old@example.com', 'Oud').run();
  assert.equal((await getUser(db, 'old@example.com'))?.role, 'user');
});

// Each superadmin test needs a database without a superadmin, so it gets its own.
const withFreshDb = async (run: (fresh: D1Database) => Promise<void>) => {
  const fresh = await createTestDb();
  try {
    await run(fresh.db);
  } finally {
    await fresh.dispose();
  }
};
const roleOf = async (d: D1Database, email: string) => (await getUser(d, email))?.role;

test('users › Configured email becomes superadmin', () =>
  withFreshDb(async (d) => {
    await createUser(d, 'boss@example.com', 'Baas', 'boss@example.com');
    assert.equal(await roleOf(d, 'boss@example.com'), 'superadmin');
  }));

test('users › Configured email in another letter case becomes superadmin', () =>
  withFreshDb(async (d) => {
    await createUser(d, 'Boss@Example.com', 'Baas', 'boss@EXAMPLE.com');
    assert.equal(await roleOf(d, 'boss@example.com'), 'superadmin');
  }));

test('users › Configured email is not promoted when a superadmin exists', () =>
  withFreshDb(async (d) => {
    await d.prepare("INSERT INTO users (email, calling_name, role) VALUES ('first@example.com', 'Eerste', 'superadmin')").run();
    await createUser(d, 'boss@example.com', 'Baas', 'boss@example.com');
    assert.equal(await roleOf(d, 'boss@example.com'), 'user');
  }));

test('users › Other emails become users', () =>
  withFreshDb(async (d) => {
    await createUser(d, 'other@example.com', 'Ander', 'boss@example.com');
    assert.equal(await roleOf(d, 'other@example.com'), 'user');
  }));

test('users › No configured email promotes nobody', () =>
  withFreshDb(async (d) => {
    await createUser(d, 'boss@example.com', 'Baas');
    await createUser(d, 'blank@example.com', 'Leeg', '');
    assert.deepEqual([await roleOf(d, 'boss@example.com'), await roleOf(d, 'blank@example.com')], ['user', 'user']);
  }));

// Nothing checks roles yet; the existing route tests already show the pages to a plain member.
test.todo("users › Today's features need no role");

test('an admin role is read from the user', async () => {
  await db.prepare("INSERT INTO users (email, calling_name, role) VALUES ('adm@example.com', 'Adm', 'admin')").run();
  assert.equal((await getUser(db, 'adm@example.com'))?.role, 'admin');
});

test('creating the same user again keeps one row and the first name', async () => {
  await createUser(db, 'twice@example.com', 'Eerste');
  await createUser(db, 'twice@example.com', 'Tweede');
  assert.equal(await rows('twice@example.com'), 1);
  assert.equal((await getUser(db, 'twice@example.com'))?.callingName, 'Eerste');
});

test('an email in a different letter case is the same user', async () => {
  await createUser(db, 'Case@Example.com', 'Cas');
  await createUser(db, 'case@example.com', 'Caspar');
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').bind('CASE@EXAMPLE.COM').first<{ n: number }>())?.n, 1);
  assert.equal((await getUser(db, 'CASE@example.com'))?.callingName, 'Cas');
});
