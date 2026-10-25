import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { defaultRules } from '~app/shared/rules';
import { getRules } from '~app/shared/rules.server';
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
  const fields = { intent: 'save', units: 'kopje', minuteWords: 'min', hourWords: 'u', degreeWords: 'graden', spoken: '' };

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
  const values = (db: D1Database) => open(db, `${role}@example.com`).then((r) => r.values);

  test('the units are the defaults', async ({ db }) => {
    assert.deepEqual((await values(db)).units.split('\n'), defaultRules.units);
  });

  test('the minute words are listed', async ({ db }) => {
    assert.equal((await values(db)).minuteWords, defaultRules.minuteWords.join('\n'));
  });

  test('the spoken amounts start with the first default', async ({ db }) => {
    const [phrase, minutes] = Object.entries(defaultRules.spoken)[0];
    assert.equal((await values(db)).spoken.split('\n')[0], `${phrase} = ${minutes}`);
  });
};

describe('parsing-rules › Admin opens the page', () => {
  showsRules('admin');
});

describe('parsing-rules › Superadmin opens the page', () => {
  showsRules('superadmin');
});

describe('action', () => {
  const ok = { intent: 'save', units: 'g\nkopje', minuteWords: 'min', hourWords: 'u', degreeWords: 'graden', spoken: 'een kwartier = 15' };

  describe('an admin saves', () => {
    test('answers saved', async ({ db }) => {
      assert.deepEqual((await post(db, 'admin@example.com', ok)).data, { saved: true });
    });

    test('stores the new rules', async ({ db }) => {
      await post(db, 'admin@example.com', ok);
      assert.deepEqual((await getRules(db)).units, ['g', 'kopje']);
    });

    test('invalid input answers errors and keeps the stored rules', async ({ db }) => {
      await post(db, 'admin@example.com', ok);
      const bad = await post(db, 'admin@example.com', { ...ok, units: '' });
      assert.equal((bad.data as { errors: object }).errors !== undefined, true);
      assert.deepEqual((await getRules(db)).units, ['g', 'kopje']);
    });

    test('reset restores the defaults', async ({ db }) => {
      await post(db, 'admin@example.com', ok);
      await post(db, 'admin@example.com', { intent: 'reset' });
      assert.deepEqual(await getRules(db), defaultRules);
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

describe('parsing-rules › Add a loose unit', () => {
  const ok = { intent: 'save', units: 'g', looseUnits: 'snufje\ndruppel', minuteWords: 'min', hourWords: 'u', degreeWords: 'graden', spoken: '' };

  test('the page shows the loose units', async ({ db }) => {
    assert.equal((await open(db, 'admin@example.com')).values.looseUnits, defaultRules.looseUnits.join('\n'));
  });

  test('saving stores the new loose unit', async ({ db }) => {
    assert.deepEqual((await post(db, 'admin@example.com', ok)).data, { saved: true });
    assert.deepEqual((await getRules(db)).looseUnits, ['snufje', 'druppel']);
  });
});
