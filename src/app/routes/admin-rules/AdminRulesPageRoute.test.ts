import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~app/.server/context';
import { getRules } from '~app/.server/rules';
import { createUser } from '~app/.server/users';
import { defaultRules } from '~app/lib/rules';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route } from './+types/route';
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

test('parsing-rules › User opens the page', async () => {
  assert.equal(await refused(open('user@example.com')), 403);
  // Someone without a user row is no admin either.
  assert.equal(await refused(open('nobody@example.com')), 403);
});

test('parsing-rules › User posts a change', async () => {
  const fields = { intent: 'save', units: 'kopje', minuteWords: 'min', hourWords: 'u', degreeWords: 'graden', spoken: '' };
  assert.equal(await refused(post('user@example.com', fields)), 403);
  assert.deepEqual(await getRules(db), defaultRules);
});

test('parsing-rules › Non-admin cannot restore defaults', async () => {
  await db
    .prepare("INSERT INTO settings (key, value) VALUES ('parsing-rules', ?)")
    .bind(JSON.stringify({ ...defaultRules, units: ['kopje'] }))
    .run();
  assert.equal(await refused(post('user@example.com', { intent: 'reset' })), 403);
  assert.deepEqual((await getRules(db)).units, ['kopje']);
  await db.prepare("DELETE FROM settings WHERE key = 'parsing-rules'").run();
});

const showsRules = async (role: string) => {
  const { values } = await open(`${role}@example.com`);
  assert.equal(values.units.split('\n').includes('g'), true);
  assert.equal(values.minuteWords, 'minuten\nminuut\nmin');
  assert.equal(values.spoken.split('\n')[0], 'een half uur = 30');
};

test('parsing-rules › Admin opens the page', () => showsRules('admin'));

test('parsing-rules › Superadmin opens the page', () => showsRules('superadmin'));

test('an admin saves and restores through the action', async () => {
  const ok = { intent: 'save', units: 'g\nkopje', minuteWords: 'min', hourWords: 'u', degreeWords: 'graden', spoken: 'een kwartier = 15' };
  assert.deepEqual((await post('admin@example.com', ok)).data, { saved: true });
  assert.deepEqual((await getRules(db)).units, ['g', 'kopje']);
  const bad = await post('admin@example.com', { ...ok, units: '' });
  assert.equal((bad.data as { errors: object }).errors !== undefined, true);
  assert.deepEqual((await getRules(db)).units, ['g', 'kopje']);
  await post('admin@example.com', { intent: 'reset' });
  assert.deepEqual(await getRules(db), defaultRules);
});

// The root loader imports app.css, which node:test cannot load; the revalidation after an action is router behaviour.
test.todo('parsing-rules › Saved change applies at once');

test('an unknown intent is refused and changes nothing', async () => {
  for (const fields of [{} as Record<string, string>, { intent: 'bogus' }]) assert.equal(await refused(post('admin@example.com', fields)), 400);
  assert.deepEqual(await getRules(db), defaultRules);
});
