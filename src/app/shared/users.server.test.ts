import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { test } from '~testing/test';
import { createUser, deleteUser, getUser, listUsers, requireAdmin, requireSuperadmin, updateUser, type Role } from './users.server';

const rows = async (db: D1Database, email: string) => (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

const roleOf = async (d: D1Database, email: string) => (await getUser(d, email))?.role;
const add = async (d: D1Database, email: string, name = 'X', role: Role = 'user') =>
  (await d.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?) RETURNING id').bind(email, name, role).first<{ id: number }>())!
    .id;
const refused = (thrown: { init?: { status?: number } }) => thrown.init?.status === 403;

describe('getUser', () => {
  test('an unknown email has no user', async ({ db }) => {
    assert.equal(await getUser(db, 'nobody@example.com'), undefined);
  });

  test('an admin role is read from the user', async ({ db }) => {
    await db.prepare("INSERT INTO users (email, calling_name, role) VALUES ('adm@example.com', 'Adm', 'admin')").run();
    assert.equal((await getUser(db, 'adm@example.com'))?.role, 'admin');
  });
});

describe('createUser', () => {
  describe('a created user', () => {
    test('is found with email and name', async ({ db }) => {
      await createUser(db, 'jos@example.com', 'Jos');
      const user = await getUser(db, 'jos@example.com');
      assert.deepEqual([user?.email, user?.callingName], ['jos@example.com', 'Jos']);
    });
  });

  describe('creating the same user again', () => {
    const twice = async (db: D1Database) => {
      await createUser(db, 'twice@example.com', 'Eerste');
      await createUser(db, 'twice@example.com', 'Tweede');
    };

    test('keeps one row', async ({ db }) => {
      await twice(db);
      assert.equal(await rows(db, 'twice@example.com'), 1);
    });

    test('keeps the first name', async ({ db }) => {
      await twice(db);
      assert.equal((await getUser(db, 'twice@example.com'))?.callingName, 'Eerste');
    });
  });

  describe('an email in a different letter case', () => {
    const twice = async (db: D1Database) => {
      await createUser(db, 'Case@Example.com', 'Cas');
      await createUser(db, 'case@example.com', 'Caspar');
    };

    test('is the same user', async ({ db }) => {
      await twice(db);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').bind('CASE@EXAMPLE.COM').first<{ n: number }>())?.n, 1);
    });

    test('keeps the first name', async ({ db }) => {
      await twice(db);
      assert.equal((await getUser(db, 'CASE@example.com'))?.callingName, 'Cas');
    });
  });
});

describe('users › New member is a user', () => {
  test('the role is user', async ({ db }) => {
    await createUser(db, 'new@example.com', 'Nieuw');
    assert.equal((await getUser(db, 'new@example.com'))?.role, 'user');
  });
});

describe('users › Same address in another case', () => {
  test('is the same member', async ({ db }) => {
    await createUser(db, 'Mama@Example.com', 'Mama');
    assert.equal((await getUser(db, 'mama@example.com'))?.callingName, 'Mama');
  });

  test('is not stored twice', async ({ db }) => {
    await createUser(db, 'Mama@Example.com', 'Mama');
    await createUser(db, 'mama@example.com', 'Mam');
    assert.equal(await rows(db, 'MAMA@EXAMPLE.COM'), 1);
  });
});

describe('users › Existing member is a user', () => {
  test('the role is user', async ({ db }) => {
    await db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind('old@example.com', 'Oud').run();
    assert.equal((await getUser(db, 'old@example.com'))?.role, 'user');
  });
});

describe('users › Configured email becomes superadmin', () => {
  test('the role is superadmin', async ({ db }) => {
    await createUser(db, 'boss@example.com', 'Baas', 'boss@example.com');
    assert.equal(await roleOf(db, 'boss@example.com'), 'superadmin');
  });
});

describe('users › Configured email in another letter case becomes superadmin', () => {
  test('the role is superadmin', async ({ db }) => {
    await createUser(db, 'Boss@Example.com', 'Baas', 'boss@EXAMPLE.com');
    assert.equal(await roleOf(db, 'boss@example.com'), 'superadmin');
  });
});

describe('users › Configured email is not promoted when a superadmin exists', () => {
  test('the role is user', async ({ db }) => {
    await db.prepare("INSERT INTO users (email, calling_name, role) VALUES ('first@example.com', 'Eerste', 'superadmin')").run();
    await createUser(db, 'boss@example.com', 'Baas', 'boss@example.com');
    assert.equal(await roleOf(db, 'boss@example.com'), 'user');
  });
});

describe('users › Other emails become users', () => {
  test('the role is user', async ({ db }) => {
    await createUser(db, 'other@example.com', 'Ander', 'boss@example.com');
    assert.equal(await roleOf(db, 'other@example.com'), 'user');
  });
});

describe('users › No configured email promotes nobody', () => {
  test('without a configured email the role is user', async ({ db }) => {
    await createUser(db, 'boss@example.com', 'Baas');
    assert.equal(await roleOf(db, 'boss@example.com'), 'user');
  });

  test('with a blank configured email the role is user', async ({ db }) => {
    await createUser(db, 'blank@example.com', 'Leeg', '');
    assert.equal(await roleOf(db, 'blank@example.com'), 'user');
  });
});

// Nothing checks roles yet; the existing route tests already show the pages to a plain member.
test.todo("users › Today's features need no role");

describe('requireAdmin', () => {
  test.beforeEach(async ({ db }) => {
    await db
      .prepare(
        "INSERT INTO users (email, calling_name, role) VALUES ('ra-admin@example.com', 'A', 'admin'), ('ra-super@example.com', 'S', 'superadmin')",
      )
      .run();
    await createUser(db, 'ra-user@example.com', 'U');
  });

  test('lets an admin through', async ({ db }) => {
    assert.equal((await requireAdmin(db, 'ra-admin@example.com')).role, 'admin');
  });

  test('lets a superadmin through, in any letter case', async ({ db }) => {
    assert.equal((await requireAdmin(db, 'RA-SUPER@example.com')).role, 'superadmin');
  });

  for (const [what, email] of [
    ['a user', 'ra-user@example.com'],
    ['an unknown email', 'ra-nobody@example.com'],
  ])
    test(`refuses ${what} with 403`, async ({ db }) => {
      await assert.rejects(requireAdmin(db, email), (thrown: { init?: { status?: number } }) => thrown.init?.status === 403);
    });
});

describe('requireSuperadmin', () => {
  test.beforeEach(async ({ db }) => {
    await add(db, 'rs-super@example.com', 'S', 'superadmin');
    await add(db, 'rs-admin@example.com', 'A', 'admin');
    await add(db, 'rs-user@example.com');
  });

  test('lets a superadmin through', async ({ db }) => {
    assert.equal((await requireSuperadmin(db, 'RS-SUPER@example.com')).role, 'superadmin');
  });

  for (const [what, email] of [
    ['an admin', 'rs-admin@example.com'],
    ['a user', 'rs-user@example.com'],
    ['an unknown email', 'rs-nobody@example.com'],
  ])
    test(`refuses ${what} with 403`, async ({ db }) => {
      await assert.rejects(requireSuperadmin(db, email), refused);
    });
});

describe('user-management › Users sorted by email', () => {
  const list = async (d: D1Database) => {
    for (const email of ['zoe@example.com', 'Anna@example.com', 'mark@example.com']) await add(d, email, email.slice(0, 3));
    return listUsers(d);
  };

  test('the users are sorted by email', async ({ db }) => {
    const { users } = await list(db);
    assert.deepEqual(
      users.map((u) => u.email),
      ['Anna@example.com', 'mark@example.com', 'zoe@example.com'],
    );
  });

  test('the list is not capped', async ({ db }) => {
    assert.equal((await list(db)).capped, false);
  });
});

const fill = (d: D1Database, n: number) =>
  d.batch(
    Array.from({ length: n }, (_, i) =>
      d.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(`u${String(i).padStart(3, '0')}@example.com`, `U${i}`),
    ),
  );

describe('user-management › Exactly 100 users', () => {
  test('all 100 are listed, not capped', async ({ db }) => {
    await fill(db, 100);
    const { users, capped } = await listUsers(db);
    assert.deepEqual([users.length, capped], [100, false]);
  });
});

describe('user-management › More than 100 users', () => {
  test('the first 100 are listed, capped', async ({ db }) => {
    await fill(db, 101);
    const { users, capped } = await listUsers(db);
    assert.deepEqual([users.length, capped, users.at(-1)?.email], [100, true, 'u099@example.com']);
  });
});

describe('user-management › Save a new calling name', () => {
  const save = async (d: D1Database) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    return updateUser(d, id, { callingName: 'Josje', role: 'user' });
  };

  test('the save succeeds', async ({ db }) => {
    assert.equal(await save(db), true);
  });

  test('the name changes and the email stays', async ({ db }) => {
    await save(db);
    const user = await getUser(db, 'jos@example.com');
    assert.deepEqual([user?.callingName, user?.email], ['Josje', 'jos@example.com']);
  });
});

describe('user-management › Give the admin role', () => {
  test('the role is admin', async ({ db }) => {
    const id = await add(db, 'jos@example.com', 'Jos');
    await updateUser(db, id, { callingName: 'Jos', role: 'admin' });
    assert.equal(await roleOf(db, 'jos@example.com'), 'admin');
  });
});

describe('user-management › Missing role keeps the role', () => {
  const save = async (d: D1Database) => {
    const id = await add(d, 'jos@example.com', 'Jos', 'admin');
    return updateUser(d, id, { callingName: 'Josje' });
  };

  test('the save succeeds', async ({ db }) => {
    assert.equal(await save(db), true);
  });

  test('the name changes and the role stays', async ({ db }) => {
    await save(db);
    const user = await getUser(db, 'jos@example.com');
    assert.deepEqual([user?.callingName, user?.role], ['Josje', 'admin']);
  });
});

describe('user-management › Unknown role', () => {
  const save = async (d: D1Database) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    await assert.rejects(updateUser(d, id, { callingName: 'Jos', role: 'owner' as Role }));
  };

  test('is rejected', async ({ db }) => {
    await save(db);
  });

  test('keeps the role', async ({ db }) => {
    await save(db);
    assert.equal(await roleOf(db, 'jos@example.com'), 'user');
  });
});

describe('user-management › Delete a user', () => {
  const remove = async (d: D1Database) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    const recipe = (await d
      .prepare("INSERT INTO recipes (slug, title, author, servings) VALUES ('t', 't', 'Oma', 4) RETURNING id")
      .first<{ id: number }>())!.id;
    await d.prepare('INSERT INTO recipe_views (user_id, recipe_id) VALUES (?, ?)').bind(id, recipe).run();
    return { id, deleted: await deleteUser(d, id) };
  };
  const count = (d: D1Database, sql: string) =>
    d
      .prepare(sql)
      .first<{ n: number }>()
      .then((r) => r!.n);

  test('the delete succeeds', async ({ db }) => {
    assert.equal((await remove(db)).deleted, true);
  });

  test('the user is gone', async ({ db }) => {
    await remove(db);
    assert.equal(await getUser(db, 'jos@example.com'), undefined);
  });

  test('their recipes stay', async ({ db }) => {
    await remove(db);
    assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM recipes'), 1);
  });

  test('their views are gone', async ({ db }) => {
    await remove(db);
    assert.equal(await count(db, 'SELECT COUNT(*) AS n FROM recipe_views'), 0);
  });

  test('deleting again reports false', async ({ db }) => {
    const { id } = await remove(db);
    assert.equal(await deleteUser(db, id), false);
  });
});

describe('user-management › Promote another member', () => {
  const promote = async (d: D1Database) => {
    await add(d, 'boss@example.com', 'Baas', 'superadmin');
    const id = await add(d, 'jos@example.com', 'Jos');
    return updateUser(d, id, { callingName: 'Jos', role: 'superadmin' });
  };

  test('the save succeeds', async ({ db }) => {
    assert.equal(await promote(db), true);
  });

  test('the role is superadmin', async ({ db }) => {
    await promote(db);
    assert.equal(await roleOf(db, 'jos@example.com'), 'superadmin');
  });
});

describe('user-management › Sole superadmin demotion is refused', () => {
  test('the demotion is refused', async ({ db }) => {
    const id = await add(db, 'boss@example.com', 'Baas', 'superadmin');
    assert.equal(await updateUser(db, id, { callingName: 'Baas', role: 'admin' }), false);
  });

  test('the role stays', async ({ db }) => {
    const id = await add(db, 'boss@example.com', 'Baas', 'superadmin');
    await updateUser(db, id, { callingName: 'Baas', role: 'admin' });
    assert.equal(await roleOf(db, 'boss@example.com'), 'superadmin');
  });

  // Keeping the role (or leaving it out) while changing the name is fine.
  test('changing only the name is fine', async ({ db }) => {
    const id = await add(db, 'boss@example.com', 'Baas', 'superadmin');
    assert.equal(await updateUser(db, id, { callingName: 'Chef' }), true);
  });
});

describe('user-management › Sole superadmin deletion is refused', () => {
  const remove = async (d: D1Database) => deleteUser(d, await add(d, 'boss@example.com', 'Baas', 'superadmin'));

  test('the deletion is refused', async ({ db }) => {
    assert.equal(await remove(db), false);
  });

  test('the user stays', async ({ db }) => {
    await remove(db);
    assert.notEqual(await getUser(db, 'boss@example.com'), undefined);
  });
});

describe('user-management › Two superadmins demote each other', () => {
  const demote = async (d: D1Database) => {
    const a = await add(d, 'a@example.com', 'A', 'superadmin');
    const b = await add(d, 'b@example.com', 'B', 'superadmin');
    return Promise.all([updateUser(d, a, { callingName: 'A', role: 'user' }), updateUser(d, b, { callingName: 'B', role: 'user' })]);
  };

  test('only one demotion succeeds', async ({ db }) => {
    assert.equal((await demote(db)).filter(Boolean).length, 1);
  });

  test('one superadmin remains', async ({ db }) => {
    await demote(db);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'superadmin'").first<{ n: number }>())?.n, 1);
  });
});
