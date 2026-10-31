import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { createRecipe } from '~app/shared/recipes.server';
import { getOrCreateShare } from '~app/shared/shares.server';
import { createUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/ShareExpiryUpdateRoute';
import { action } from './ShareExpiryUpdateRoute';

const post = (db: D1Database, slug: string, fields: Record<string, string>, email = 'oma@example.com') => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, email);
  const request = new Request('http://x/', { method: 'POST', body: new URLSearchParams(fields) });
  return action(fake<Route.ActionArgs>({ request, params: { slug }, context }));
};
const stored = async (db: D1Database) =>
  (await db.prepare('SELECT expires_at AS expiresAt FROM recipe_shares').all<{ expiresAt: string | null }>()).results.map((r) => r.expiresAt);

let slug: string;
test.beforeEach(async ({ db }) => {
  await createUser(db, 'oma@example.com', 'Oma');
  await createUser(db, 'opa@example.com', 'Opa');
  slug = await createRecipe(db, { title: 'Appeltaart', author: 'Oma' });
});

describe('recipe-sharing › A choice is stored at once', () => {
  test('the end date seven days on is answered and stored', async ({ db }) => {
    await getOrCreateShare(db, 'oma@example.com', slug);
    const before = Date.now();
    const response = await post(db, slug, { expires: '7d' });
    assert.equal(response.status, 200);
    const { expiresAt } = (await response.json()) as { expiresAt: string };
    const week = 7 * 24 * 3_600_000;
    assert.ok(Math.abs(Date.parse(expiresAt) - (before + week)) < 10_000);
    assert.deepEqual(await stored(db), [expiresAt]);
  });
});

describe('recipe-sharing › Nooit removes the end date', () => {
  test('the share has no end date', async ({ db }) => {
    await getOrCreateShare(db, 'oma@example.com', slug);
    await post(db, slug, { expires: '24h' });
    const response = await post(db, slug, { expires: 'never' });
    assert.deepEqual(await response.json(), { expiresAt: null });
    assert.deepEqual(await stored(db), [null]);
  });
});

describe("recipe-sharing › Another member's share is refused", () => {
  test('a member without a share gets 404 and the share of the other stays', async ({ db }) => {
    await getOrCreateShare(db, 'oma@example.com', slug);
    assert.equal((await post(db, slug, { expires: '7d' }, 'opa@example.com')).status, 404);
    assert.deepEqual(await stored(db), [null]);
  });

  test('a recipe nobody shared gets 404', async ({ db }) => {
    assert.equal((await post(db, slug, { expires: '7d' })).status, 404);
  });

  test('an unknown recipe gets 404', async ({ db }) => {
    assert.equal((await post(db, 'does-not-exist', { expires: '7d' })).status, 404);
  });
});

describe('recipe-sharing › An expired share is refused', () => {
  test('404 and the share is unchanged', async ({ db }) => {
    await getOrCreateShare(db, 'oma@example.com', slug);
    await db.prepare("UPDATE recipe_shares SET expires_at = '2020-01-01T00:00:00Z'").run();
    assert.equal((await post(db, slug, { expires: '7d' })).status, 404);
    assert.deepEqual(await stored(db), ['2020-01-01T00:00:00Z']);
  });
});

describe('recipe-sharing › Unknown choice is refused', () => {
  test('an unknown value gives 400 and the share is unchanged', async ({ db }) => {
    await getOrCreateShare(db, 'oma@example.com', slug);
    assert.equal((await post(db, slug, { expires: '2d' })).status, 400);
    assert.deepEqual(await stored(db), [null]);
  });

  test('a missing value gives 400', async ({ db }) => {
    await getOrCreateShare(db, 'oma@example.com', slug);
    assert.equal((await post(db, slug, {})).status, 400);
  });
});
