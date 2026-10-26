import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { defaultRules } from '~app/shared/rules';
import { getRules, toRows, type RulesRows } from '~app/shared/rules.server';
import { createUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/AdminRulesPageRoute';
import { action, loader } from './AdminRulesPageRoute';

// Real loader and action against an in-memory D1.
test.beforeEach(async ({ db }) => {
  await createUser(db, 'user@example.com', 'Uli');
  for (const role of ['admin', 'superadmin'])
    await db.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?)').bind(`${role}@example.com`, role, role).run();
});

const contextFor = (db: D1Database, email: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  return context;
};
const open = (db: D1Database, email: string) =>
  loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/beheer/herkenning'), context: contextFor(db, email) }));
const rowsField = (change: Partial<RulesRows> = {}) => JSON.stringify({ ...toRows(defaultRules), ...change });
const post = (db: D1Database, email: string, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/beheer/herkenning', { method: 'POST', body: new URLSearchParams(fields) }),
      context: contextFor(db, email),
    }),
  );
/** What the call throws (a 403 is thrown as a response), or undefined when it succeeds. */
const refused = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (thrown) {
    return (thrown as { init?: { status?: number }; status?: number }).init?.status ?? (thrown as Response).status;
  }
};

describe('parsing-rules › User opens the page', () => {
  test('is refused with 403', async ({ db }) => {
    assert.equal(await refused(open(db, 'user@example.com')), 403);
  });

  // Someone without a user row is no admin either.
  test('someone without a user row is refused with 403', async ({ db }) => {
    assert.equal(await refused(open(db, 'nobody@example.com')), 403);
  });
});

describe('parsing-rules › User posts a change', () => {
  const fields = { intent: 'save', rules: rowsField({ units: ['kopje'] }) };

  test('is refused with 403', async ({ db }) => {
    assert.equal(await refused(post(db, 'user@example.com', fields)), 403);
  });

  test('the stored rules stay the defaults', async ({ db }) => {
    await refused(post(db, 'user@example.com', fields));
    assert.deepEqual(await getRules(db), defaultRules);
  });
});

describe('parsing-rules › Non-admin cannot restore defaults', () => {
  test.beforeEach(async ({ db }) => {
    await db
      .prepare("INSERT INTO settings (key, value) VALUES ('parsing-rules', ?)")
      .bind(JSON.stringify({ ...defaultRules, units: ['kopje'] }))
      .run();
  });

  test('is refused with 403', async ({ db }) => {
    assert.equal(await refused(post(db, 'user@example.com', { intent: 'reset' })), 403);
  });

  test('the custom rules are kept', async ({ db }) => {
    await refused(post(db, 'user@example.com', { intent: 'reset' }));
    assert.deepEqual((await getRules(db)).units, ['kopje']);
  });
});

const showsRules = (role: string) => {
  test('the rows are the stored rules', async ({ db }) => {
    assert.deepEqual((await open(db, `${role}@example.com`)).rows, toRows(defaultRules));
  });
};

describe('parsing-rules › Admin opens the page', () => {
  showsRules('admin');
});

describe('parsing-rules › Superadmin opens the page', () => {
  showsRules('superadmin');
});

describe('action', () => {
  const ok = { intent: 'save', rules: rowsField({ units: ['g', 'kopje'] }) };

  describe('an admin saves', () => {
    test('answers saved', async ({ db }) => {
      const { data } = await post(db, 'admin@example.com', ok);
      assert.ok('saved' in data);
    });

    test('stores the new rules', async ({ db }) => {
      await post(db, 'admin@example.com', ok);
      assert.deepEqual((await getRules(db)).units, ['g', 'kopje']);
    });

    test('reset restores the defaults', async ({ db }) => {
      await post(db, 'admin@example.com', ok);
      await post(db, 'admin@example.com', { intent: 'reset' });
      assert.deepEqual(await getRules(db), defaultRules);
    });

    for (const rules of ['not json', '{"units":"g"}', 'null', ''])
      test(`rules ${JSON.stringify(rules)} is refused with 400`, async ({ db }) => {
        assert.equal(await refused(post(db, 'admin@example.com', { intent: 'save', rules })), 400);
      });
  });

  describe('an unknown intent', () => {
    for (const fields of [{} as Record<string, string>, { intent: 'bogus' }]) {
      test(`${JSON.stringify(fields)} is refused with 400`, async ({ db }) => {
        assert.equal(await refused(post(db, 'admin@example.com', fields)), 400);
      });
    }

    test('changes nothing', async ({ db }) => {
      await refused(post(db, 'admin@example.com', { intent: 'bogus' }));
      assert.deepEqual(await getRules(db), defaultRules);
    });
  });
});

// The revalidation after an action is router behaviour.
test.todo('parsing-rules › Saved change applies at once');

describe('parsing-rules › Restore defaults', () => {
  test('the page shows the defaults again', async ({ db }) => {
    await post(db, 'admin@example.com', { intent: 'save', rules: rowsField({ units: ['kopje'] }) });
    await post(db, 'admin@example.com', { intent: 'reset' });
    assert.deepEqual((await open(db, 'admin@example.com')).rows, toRows(defaultRules));
  });
});

describe('parsing-rules › Refused save keeps the rows', () => {
  const sent = { ...toRows(defaultRules), units: ['kopje', 'a+', ''] };
  const refusedSave = async (db: D1Database) => {
    const result = await post(db, 'admin@example.com', { intent: 'save', rules: JSON.stringify(sent) });
    return {
      init: result.init,
      ...(result.data as { rows: RulesRows; errors: Partial<Record<keyof RulesRows, { rows?: Record<number, string> }>> }),
    };
  };

  test('the rows come back as they were sent', async ({ db }) => {
    assert.deepEqual((await refusedSave(db)).rows, sent);
  });

  test('the message is on the faulty row', async ({ db }) => {
    assert.deepEqual(Object.keys((await refusedSave(db)).errors.units?.rows ?? {}), ['1']);
  });

  test('the answer is 400 and nothing is stored', async ({ db }) => {
    assert.equal((await refusedSave(db)).init?.status, 400);
    assert.deepEqual(await getRules(db), defaultRules);
  });
});
