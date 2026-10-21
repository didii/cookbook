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

test('users › Seeded superadmin', async () => {
  await createUser(db, 'info@rhythm-coder.dev', 'Info');
  assert.equal((await getUser(db, 'info@rhythm-coder.dev'))?.role, 'superadmin');
});

test('users › Seeded address in another case', async () => {
  await createUser(db, 'Info@Rhythm-Coder.dev', 'Info');
  assert.equal((await getUser(db, 'INFO@rhythm-coder.dev'))?.role, 'superadmin');
});

// Nothing checks roles yet; the existing route tests already show the pages to a plain member.
test.todo("users › Today's features need no role");

test('an admin role is read from the roles table', async () => {
  await db.prepare("INSERT INTO roles (email, role) VALUES ('adm@example.com', 'admin')").run();
  await createUser(db, 'adm@example.com', 'Adm');
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
