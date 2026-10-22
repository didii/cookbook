import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { createUser, deleteUser, getUser, listUsers, requireAdmin, requireSuperadmin, updateUser, type Role } from './users';

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

test('requireAdmin lets admin and superadmin through and refuses a user, an unknown email and a missing row with 403', async () => {
  await db
    .prepare(
      "INSERT INTO users (email, calling_name, role) VALUES ('ra-admin@example.com', 'A', 'admin'), ('ra-super@example.com', 'S', 'superadmin')",
    )
    .run();
  await createUser(db, 'ra-user@example.com', 'U');
  assert.equal((await requireAdmin(db, 'ra-admin@example.com')).role, 'admin');
  assert.equal((await requireAdmin(db, 'RA-SUPER@example.com')).role, 'superadmin');
  for (const email of ['ra-user@example.com', 'ra-nobody@example.com'])
    await assert.rejects(requireAdmin(db, email), (thrown: { init?: { status?: number } }) => thrown.init?.status === 403);
});

const add = async (d: D1Database, email: string, name = 'X', role: Role = 'user') =>
  (await d.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?) RETURNING id').bind(email, name, role).first<{ id: number }>())!
    .id;
const refused = (thrown: { init?: { status?: number } }) => thrown.init?.status === 403;

test('requireSuperadmin lets a superadmin through and refuses others with 403', () =>
  withFreshDb(async (d) => {
    await add(d, 'rs-super@example.com', 'S', 'superadmin');
    await add(d, 'rs-admin@example.com', 'A', 'admin');
    await add(d, 'rs-user@example.com');
    assert.equal((await requireSuperadmin(d, 'RS-SUPER@example.com')).role, 'superadmin');
    for (const email of ['rs-admin@example.com', 'rs-user@example.com', 'rs-nobody@example.com'])
      await assert.rejects(requireSuperadmin(d, email), refused);
  }));

test('user-management › Users sorted by email', () =>
  withFreshDb(async (d) => {
    for (const email of ['zoe@example.com', 'Anna@example.com', 'mark@example.com']) await add(d, email, email.slice(0, 3));
    const { users, capped } = await listUsers(d);
    assert.deepEqual(
      users.map((u) => u.email),
      ['Anna@example.com', 'mark@example.com', 'zoe@example.com'],
    );
    assert.equal(capped, false);
  }));

const fill = (d: D1Database, n: number) =>
  d.batch(
    Array.from({ length: n }, (_, i) =>
      d.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(`u${String(i).padStart(3, '0')}@example.com`, `U${i}`),
    ),
  );

test('user-management › Exactly 100 users', () =>
  withFreshDb(async (d) => {
    await fill(d, 100);
    const { users, capped } = await listUsers(d);
    assert.deepEqual([users.length, capped], [100, false]);
  }));

test('user-management › More than 100 users', () =>
  withFreshDb(async (d) => {
    await fill(d, 101);
    const { users, capped } = await listUsers(d);
    assert.deepEqual([users.length, capped, users.at(-1)?.email], [100, true, 'u099@example.com']);
  }));

test('user-management › Save a new calling name', () =>
  withFreshDb(async (d) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    assert.equal(await updateUser(d, id, { callingName: 'Josje', role: 'user' }), true);
    const user = await getUser(d, 'jos@example.com');
    assert.deepEqual([user?.callingName, user?.email], ['Josje', 'jos@example.com']);
  }));

test('user-management › Give the admin role', () =>
  withFreshDb(async (d) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    await updateUser(d, id, { callingName: 'Jos', role: 'admin' });
    assert.equal(await roleOf(d, 'jos@example.com'), 'admin');
  }));

test('user-management › Missing role keeps the role', () =>
  withFreshDb(async (d) => {
    const id = await add(d, 'jos@example.com', 'Jos', 'admin');
    assert.equal(await updateUser(d, id, { callingName: 'Josje' }), true);
    const user = await getUser(d, 'jos@example.com');
    assert.deepEqual([user?.callingName, user?.role], ['Josje', 'admin']);
  }));

test('user-management › Unknown role', () =>
  withFreshDb(async (d) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    await assert.rejects(updateUser(d, id, { callingName: 'Jos', role: 'owner' as Role }));
    assert.equal(await roleOf(d, 'jos@example.com'), 'user');
  }));

test('user-management › Delete a user', () =>
  withFreshDb(async (d) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    const recipe = (await d
      .prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('t', 't', 'Oma', 4) RETURNING id")
      .first<{ id: number }>())!.id;
    await d.prepare('INSERT INTO recipe_views (user_id, recipe_id) VALUES (?, ?)').bind(id, recipe).run();
    assert.equal(await deleteUser(d, id), true);
    assert.equal(await getUser(d, 'jos@example.com'), undefined);
    const count = (sql: string) =>
      d
        .prepare(sql)
        .first<{ n: number }>()
        .then((r) => r!.n);
    assert.deepEqual([await count('SELECT COUNT(*) AS n FROM recipes'), await count('SELECT COUNT(*) AS n FROM recipe_views')], [1, 0]);
    assert.equal(await deleteUser(d, id), false);
  }));

test('user-management › Promote another member', () =>
  withFreshDb(async (d) => {
    await add(d, 'boss@example.com', 'Baas', 'superadmin');
    const id = await add(d, 'jos@example.com', 'Jos');
    assert.equal(await updateUser(d, id, { callingName: 'Jos', role: 'superadmin' }), true);
    assert.equal(await roleOf(d, 'jos@example.com'), 'superadmin');
  }));

test('user-management › Sole superadmin demotion is refused', () =>
  withFreshDb(async (d) => {
    const id = await add(d, 'boss@example.com', 'Baas', 'superadmin');
    assert.equal(await updateUser(d, id, { callingName: 'Baas', role: 'admin' }), false);
    assert.equal(await roleOf(d, 'boss@example.com'), 'superadmin');
    // Keeping the role (or leaving it out) while changing the name is fine.
    assert.equal(await updateUser(d, id, { callingName: 'Chef' }), true);
  }));

test('user-management › Sole superadmin deletion is refused', () =>
  withFreshDb(async (d) => {
    const id = await add(d, 'boss@example.com', 'Baas', 'superadmin');
    assert.equal(await deleteUser(d, id), false);
    assert.notEqual(await getUser(d, 'boss@example.com'), undefined);
  }));

test('user-management › Two superadmins demote each other', () =>
  withFreshDb(async (d) => {
    const a = await add(d, 'a@example.com', 'A', 'superadmin');
    const b = await add(d, 'b@example.com', 'B', 'superadmin');
    const results = await Promise.all([updateUser(d, a, { callingName: 'A', role: 'user' }), updateUser(d, b, { callingName: 'B', role: 'user' })]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await d.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'superadmin'").first<{ n: number }>())?.n, 1);
  }));
