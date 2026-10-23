import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { defaultRules } from '~app/shared/rules';
import { getRules } from '~app/shared/rules.server';
import { createUser } from '~app/shared/users.server';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route } from './+types/AdminRulesPageRoute';
import { action, loader } from './AdminRulesPageRoute';

// Real loader and action against an in-memory D1.
let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
  await createUser(db, 'user@example.com', 'Uli');
  for (const role of ['admin', 'superadmin'])
    await db.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?)').bind(`${role}@example.com`, role, role).run();
});

after(() => dispose());

const contextFor = (email: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  return context;
};
const open = (email: string) =>
  loader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/beheer/herkenning'), context: contextFor(email) }));
const post = (email: string, fields: Record<string, string>) =>
  action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/beheer/herkenning', { method: 'POST', body: new URLSearchParams(fields) }),
      context: contextFor(email),
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
  test('is refused with 403', async () => {
    assert.equal(await refused(open('user@example.com')), 403);
  });

  // Someone without a user row is no admin either.
  test('someone without a user row is refused with 403', async () => {
    assert.equal(await refused(open('nobody@example.com')), 403);
  });
});

describe('parsing-rules › User posts a change', () => {
  const fields = { intent: 'save', units: 'kopje', minuteWords: 'min', hourWords: 'u', degreeWords: 'graden', spoken: '' };

  test('is refused with 403', async () => {
    assert.equal(await refused(post('user@example.com', fields)), 403);
  });

  test('the stored rules stay the defaults', async () => {
    await refused(post('user@example.com', fields));
    assert.deepEqual(await getRules(db), defaultRules);
  });
});

describe('parsing-rules › Non-admin cannot restore defaults', () => {
  beforeEach(async () => {
    await db
      .prepare("INSERT INTO settings (key, value) VALUES ('parsing-rules', ?)")
      .bind(JSON.stringify({ ...defaultRules, units: ['kopje'] }))
      .run();
  });
  afterEach(async () => {
    await db.prepare("DELETE FROM settings WHERE key = 'parsing-rules'").run();
  });

  test('is refused with 403', async () => {
    assert.equal(await refused(post('user@example.com', { intent: 'reset' })), 403);
  });

  test('the custom rules are kept', async () => {
    await refused(post('user@example.com', { intent: 'reset' }));
    assert.deepEqual((await getRules(db)).units, ['kopje']);
  });
});

const showsRules = (role: string) => {
  const values = () => open(`${role}@example.com`).then((r) => r.values);

  test('the units include g', async () => {
    assert.equal((await values()).units.split('\n').includes('g'), true);
  });

  test('the minute words are listed', async () => {
    assert.equal((await values()).minuteWords, 'minuten\nminuut\nmin');
  });

  test('the spoken amounts start with the first default', async () => {
    assert.equal((await values()).spoken.split('\n')[0], 'een half uur = 30');
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
    test('answers saved', async () => {
      assert.deepEqual((await post('admin@example.com', ok)).data, { saved: true });
    });

    test('stores the new rules', async () => {
      await post('admin@example.com', ok);
      assert.deepEqual((await getRules(db)).units, ['g', 'kopje']);
    });

    test('invalid input answers errors and keeps the stored rules', async () => {
      await post('admin@example.com', ok);
      const bad = await post('admin@example.com', { ...ok, units: '' });
      assert.equal((bad.data as { errors: object }).errors !== undefined, true);
      assert.deepEqual((await getRules(db)).units, ['g', 'kopje']);
    });

    test('reset restores the defaults', async () => {
      await post('admin@example.com', ok);
      await post('admin@example.com', { intent: 'reset' });
      assert.deepEqual(await getRules(db), defaultRules);
    });
  });

  describe('an unknown intent', () => {
    for (const fields of [{} as Record<string, string>, { intent: 'bogus' }]) {
      test(`${JSON.stringify(fields)} is refused with 400`, async () => {
        assert.equal(await refused(post('admin@example.com', fields)), 400);
      });
    }

    test('changes nothing', async () => {
      await refused(post('admin@example.com', { intent: 'bogus' }));
      assert.deepEqual(await getRules(db), defaultRules);
    });
  });
});

// The root loader imports app.css, which node:test cannot load; the revalidation after an action is router behaviour.
test.todo('parsing-rules › Saved change applies at once');
