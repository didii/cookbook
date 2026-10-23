import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { createUser, deleteUser, getUser, listUsers, requireAdmin, requireSuperadmin, updateUser, type Role } from './users.server';

let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const rows = async (email: string) => (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

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
const add = async (d: D1Database, email: string, name = 'X', role: Role = 'user') =>
  (await d.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?) RETURNING id').bind(email, name, role).first<{ id: number }>())!
    .id;
const refused = (thrown: { init?: { status?: number } }) => thrown.init?.status === 403;

describe('getUser', () => {
  test('an unknown email has no user', async () => {
    assert.equal(await getUser(db, 'nobody@example.com'), undefined);
  });

  test('an admin role is read from the user', async () => {
    await db.prepare("INSERT INTO users (email, calling_name, role) VALUES ('adm@example.com', 'Adm', 'admin')").run();
    assert.equal((await getUser(db, 'adm@example.com'))?.role, 'admin');
  });
});

describe('createUser', () => {
  describe('a created user', () => {
    const create = async () => {
      await createUser(db, 'jos@example.com', 'Jos');
      return getUser(db, 'jos@example.com');
    };

    test('is found with email and name', async () => {
      const user = await create();
      assert.deepEqual([user?.email, user?.callingName], ['jos@example.com', 'Jos']);
    });

    test('has a creation time', async () => {
      assert.match((await create())!.createdAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    });
  });

  describe('creating the same user again', () => {
    const twice = async () => {
      await createUser(db, 'twice@example.com', 'Eerste');
      await createUser(db, 'twice@example.com', 'Tweede');
    };

    test('keeps one row', async () => {
      await twice();
      assert.equal(await rows('twice@example.com'), 1);
    });

    test('keeps the first name', async () => {
      await twice();
      assert.equal((await getUser(db, 'twice@example.com'))?.callingName, 'Eerste');
    });
  });

  describe('an email in a different letter case', () => {
    const twice = async () => {
      await createUser(db, 'Case@Example.com', 'Cas');
      await createUser(db, 'case@example.com', 'Caspar');
    };

    test('is the same user', async () => {
      await twice();
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users WHERE email = ?').bind('CASE@EXAMPLE.COM').first<{ n: number }>())?.n, 1);
    });

    test('keeps the first name', async () => {
      await twice();
      assert.equal((await getUser(db, 'CASE@example.com'))?.callingName, 'Cas');
    });
  });
});

describe('users › New member is a user', () => {
  test('the role is user', async () => {
    await createUser(db, 'new@example.com', 'Nieuw');
    assert.equal((await getUser(db, 'new@example.com'))?.role, 'user');
  });
});

describe('users › Existing member is a user', () => {
  test('the role is user', async () => {
    await db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind('old@example.com', 'Oud').run();
    assert.equal((await getUser(db, 'old@example.com'))?.role, 'user');
  });
});

describe('users › Configured email becomes superadmin', () => {
  test('the role is superadmin', () =>
    withFreshDb(async (d) => {
      await createUser(d, 'boss@example.com', 'Baas', 'boss@example.com');
      assert.equal(await roleOf(d, 'boss@example.com'), 'superadmin');
    }));
});

describe('users › Configured email in another letter case becomes superadmin', () => {
  test('the role is superadmin', () =>
    withFreshDb(async (d) => {
      await createUser(d, 'Boss@Example.com', 'Baas', 'boss@EXAMPLE.com');
      assert.equal(await roleOf(d, 'boss@example.com'), 'superadmin');
    }));
});

describe('users › Configured email is not promoted when a superadmin exists', () => {
  test('the role is user', () =>
    withFreshDb(async (d) => {
      await d.prepare("INSERT INTO users (email, calling_name, role) VALUES ('first@example.com', 'Eerste', 'superadmin')").run();
      await createUser(d, 'boss@example.com', 'Baas', 'boss@example.com');
      assert.equal(await roleOf(d, 'boss@example.com'), 'user');
    }));
});

describe('users › Other emails become users', () => {
  test('the role is user', () =>
    withFreshDb(async (d) => {
      await createUser(d, 'other@example.com', 'Ander', 'boss@example.com');
      assert.equal(await roleOf(d, 'other@example.com'), 'user');
    }));
});

describe('users › No configured email promotes nobody', () => {
  test('without a configured email the role is user', () =>
    withFreshDb(async (d) => {
      await createUser(d, 'boss@example.com', 'Baas');
      assert.equal(await roleOf(d, 'boss@example.com'), 'user');
    }));

  test('with a blank configured email the role is user', () =>
    withFreshDb(async (d) => {
      await createUser(d, 'blank@example.com', 'Leeg', '');
      assert.equal(await roleOf(d, 'blank@example.com'), 'user');
    }));
});

// Nothing checks roles yet; the existing route tests already show the pages to a plain member.
test.todo("users › Today's features need no role");

describe('requireAdmin', () => {
  before(async () => {
    await db
      .prepare(
        "INSERT INTO users (email, calling_name, role) VALUES ('ra-admin@example.com', 'A', 'admin'), ('ra-super@example.com', 'S', 'superadmin')",
      )
      .run();
    await createUser(db, 'ra-user@example.com', 'U');
  });

  test('lets an admin through', async () => {
    assert.equal((await requireAdmin(db, 'ra-admin@example.com')).role, 'admin');
  });

  test('lets a superadmin through, in any letter case', async () => {
    assert.equal((await requireAdmin(db, 'RA-SUPER@example.com')).role, 'superadmin');
  });

  for (const [what, email] of [
    ['a user', 'ra-user@example.com'],
    ['an unknown email', 'ra-nobody@example.com'],
  ])
    test(`refuses ${what} with 403`, async () => {
      await assert.rejects(requireAdmin(db, email), (thrown: { init?: { status?: number } }) => thrown.init?.status === 403);
    });
});

describe('requireSuperadmin', () => {
  const setup = (run: (d: D1Database) => Promise<void>) => () =>
    withFreshDb(async (d) => {
      await add(d, 'rs-super@example.com', 'S', 'superadmin');
      await add(d, 'rs-admin@example.com', 'A', 'admin');
      await add(d, 'rs-user@example.com');
      await run(d);
    });

  test(
    'lets a superadmin through',
    setup(async (d) => {
      assert.equal((await requireSuperadmin(d, 'RS-SUPER@example.com')).role, 'superadmin');
    }),
  );

  for (const [what, email] of [
    ['an admin', 'rs-admin@example.com'],
    ['a user', 'rs-user@example.com'],
    ['an unknown email', 'rs-nobody@example.com'],
  ])
    test(
      `refuses ${what} with 403`,
      setup(async (d) => {
        await assert.rejects(requireSuperadmin(d, email), refused);
      }),
    );
});

describe('user-management › Users sorted by email', () => {
  const list = async () => {
    const fresh = await createTestDb();
    try {
      for (const email of ['zoe@example.com', 'Anna@example.com', 'mark@example.com']) await add(fresh.db, email, email.slice(0, 3));
      return await listUsers(fresh.db);
    } finally {
      await fresh.dispose();
    }
  };

  test('the users are sorted by email', async () => {
    const { users } = await list();
    assert.deepEqual(
      users.map((u) => u.email),
      ['Anna@example.com', 'mark@example.com', 'zoe@example.com'],
    );
  });

  test('the list is not capped', async () => {
    assert.equal((await list()).capped, false);
  });
});

const fill = (d: D1Database, n: number) =>
  d.batch(
    Array.from({ length: n }, (_, i) =>
      d.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?)').bind(`u${String(i).padStart(3, '0')}@example.com`, `U${i}`),
    ),
  );

describe('user-management › Exactly 100 users', () => {
  test('all 100 are listed, not capped', () =>
    withFreshDb(async (d) => {
      await fill(d, 100);
      const { users, capped } = await listUsers(d);
      assert.deepEqual([users.length, capped], [100, false]);
    }));
});

describe('user-management › More than 100 users', () => {
  test('the first 100 are listed, capped', () =>
    withFreshDb(async (d) => {
      await fill(d, 101);
      const { users, capped } = await listUsers(d);
      assert.deepEqual([users.length, capped, users.at(-1)?.email], [100, true, 'u099@example.com']);
    }));
});

describe('user-management › Save a new calling name', () => {
  const save = async (d: D1Database) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    return updateUser(d, id, { callingName: 'Josje', role: 'user' });
  };

  test('the save succeeds', () =>
    withFreshDb(async (d) => {
      assert.equal(await save(d), true);
    }));

  test('the name changes and the email stays', () =>
    withFreshDb(async (d) => {
      await save(d);
      const user = await getUser(d, 'jos@example.com');
      assert.deepEqual([user?.callingName, user?.email], ['Josje', 'jos@example.com']);
    }));
});

describe('user-management › Give the admin role', () => {
  test('the role is admin', () =>
    withFreshDb(async (d) => {
      const id = await add(d, 'jos@example.com', 'Jos');
      await updateUser(d, id, { callingName: 'Jos', role: 'admin' });
      assert.equal(await roleOf(d, 'jos@example.com'), 'admin');
    }));
});

describe('user-management › Missing role keeps the role', () => {
  const save = async (d: D1Database) => {
    const id = await add(d, 'jos@example.com', 'Jos', 'admin');
    return updateUser(d, id, { callingName: 'Josje' });
  };

  test('the save succeeds', () =>
    withFreshDb(async (d) => {
      assert.equal(await save(d), true);
    }));

  test('the name changes and the role stays', () =>
    withFreshDb(async (d) => {
      await save(d);
      const user = await getUser(d, 'jos@example.com');
      assert.deepEqual([user?.callingName, user?.role], ['Josje', 'admin']);
    }));
});

describe('user-management › Unknown role', () => {
  const save = async (d: D1Database) => {
    const id = await add(d, 'jos@example.com', 'Jos');
    await assert.rejects(updateUser(d, id, { callingName: 'Jos', role: 'owner' as Role }));
  };

  test('is rejected', () => withFreshDb(save));

  test('keeps the role', () =>
    withFreshDb(async (d) => {
      await save(d);
      assert.equal(await roleOf(d, 'jos@example.com'), 'user');
    }));
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

  test('the delete succeeds', () =>
    withFreshDb(async (d) => {
      assert.equal((await remove(d)).deleted, true);
    }));

  test('the user is gone', () =>
    withFreshDb(async (d) => {
      await remove(d);
      assert.equal(await getUser(d, 'jos@example.com'), undefined);
    }));

  test('their recipes stay', () =>
    withFreshDb(async (d) => {
      await remove(d);
      assert.equal(await count(d, 'SELECT COUNT(*) AS n FROM recipes'), 1);
    }));

  test('their views are gone', () =>
    withFreshDb(async (d) => {
      await remove(d);
      assert.equal(await count(d, 'SELECT COUNT(*) AS n FROM recipe_views'), 0);
    }));

  test('deleting again reports false', () =>
    withFreshDb(async (d) => {
      const { id } = await remove(d);
      assert.equal(await deleteUser(d, id), false);
    }));
});

describe('user-management › Promote another member', () => {
  const promote = async (d: D1Database) => {
    await add(d, 'boss@example.com', 'Baas', 'superadmin');
    const id = await add(d, 'jos@example.com', 'Jos');
    return updateUser(d, id, { callingName: 'Jos', role: 'superadmin' });
  };

  test('the save succeeds', () =>
    withFreshDb(async (d) => {
      assert.equal(await promote(d), true);
    }));

  test('the role is superadmin', () =>
    withFreshDb(async (d) => {
      await promote(d);
      assert.equal(await roleOf(d, 'jos@example.com'), 'superadmin');
    }));
});

describe('user-management › Sole superadmin demotion is refused', () => {
  test('the demotion is refused', () =>
    withFreshDb(async (d) => {
      const id = await add(d, 'boss@example.com', 'Baas', 'superadmin');
      assert.equal(await updateUser(d, id, { callingName: 'Baas', role: 'admin' }), false);
    }));

  test('the role stays', () =>
    withFreshDb(async (d) => {
      const id = await add(d, 'boss@example.com', 'Baas', 'superadmin');
      await updateUser(d, id, { callingName: 'Baas', role: 'admin' });
      assert.equal(await roleOf(d, 'boss@example.com'), 'superadmin');
    }));

  // Keeping the role (or leaving it out) while changing the name is fine.
  test('changing only the name is fine', () =>
    withFreshDb(async (d) => {
      const id = await add(d, 'boss@example.com', 'Baas', 'superadmin');
      assert.equal(await updateUser(d, id, { callingName: 'Chef' }), true);
    }));
});

describe('user-management › Sole superadmin deletion is refused', () => {
  const remove = async (d: D1Database) => deleteUser(d, await add(d, 'boss@example.com', 'Baas', 'superadmin'));

  test('the deletion is refused', () =>
    withFreshDb(async (d) => {
      assert.equal(await remove(d), false);
    }));

  test('the user stays', () =>
    withFreshDb(async (d) => {
      await remove(d);
      assert.notEqual(await getUser(d, 'boss@example.com'), undefined);
    }));
});

describe('user-management › Two superadmins demote each other', () => {
  const demote = async (d: D1Database) => {
    const a = await add(d, 'a@example.com', 'A', 'superadmin');
    const b = await add(d, 'b@example.com', 'B', 'superadmin');
    return Promise.all([updateUser(d, a, { callingName: 'A', role: 'user' }), updateUser(d, b, { callingName: 'B', role: 'user' })]);
  };

  test('only one demotion succeeds', () =>
    withFreshDb(async (d) => {
      assert.equal((await demote(d)).filter(Boolean).length, 1);
    }));

  test('one superadmin remains', () =>
    withFreshDb(async (d) => {
      await demote(d);
      assert.equal((await d.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'superadmin'").first<{ n: number }>())?.n, 1);
    }));
});
