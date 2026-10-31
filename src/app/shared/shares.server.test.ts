import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { test } from '~testing/test';
import { createRecipe } from './recipes.server';
import { getOrCreateShare, setShareExpiry } from './shares.server';
import { createUser } from './users.server';

const oma = 'oma@example.com';
const opa = 'opa@example.com';
const now = new Date('2026-03-10T12:00:00Z');

const rows = (db: D1Database) =>
  db.prepare('SELECT token, expires_at AS expiresAt FROM recipe_shares').all<{ token: string; expiresAt: string | null }>();
const setExpiry = (db: D1Database, expiresAt: string | null) => db.prepare('UPDATE recipe_shares SET expires_at = ?').bind(expiresAt).run();

let slug: string;
test.beforeEach(async ({ db }) => {
  await createUser(db, oma, 'Oma');
  await createUser(db, opa, 'Opa');
  slug = await createRecipe(db, { title: 'Appeltaart', author: 'Oma' });
});

describe('recipe-sharing › The first share creates a link', () => {
  test('one share is stored, without an end date', async ({ db }) => {
    const share = await getOrCreateShare(db, oma, slug, now);
    assert.equal(share?.created, true);
    assert.equal(share?.expiresAt, null);
    const stored = (await rows(db)).results;
    assert.equal(stored.length, 1);
    assert.deepEqual(stored[0], { token: share?.token, expiresAt: null });
  });
});

describe('recipe-sharing › Opening again shows the same link', () => {
  test('the same token comes back and one share is stored', async ({ db }) => {
    const first = await getOrCreateShare(db, oma, slug, now);
    const second = await getOrCreateShare(db, oma, slug, now);
    assert.equal(second?.token, first?.token);
    assert.equal((await rows(db)).results.length, 1);
  });

  test('the second call does not report a new share', async ({ db }) => {
    await getOrCreateShare(db, oma, slug, now);
    assert.equal((await getOrCreateShare(db, oma, slug, now))?.created, false);
  });
});

describe('recipe-sharing › Another member has their own link', () => {
  test('the tokens differ', async ({ db }) => {
    const a = await getOrCreateShare(db, oma, slug, now);
    const b = await getOrCreateShare(db, opa, slug, now);
    assert.notEqual(a?.token, b?.token);
    assert.equal((await rows(db)).results.length, 2);
  });
});

describe('recipe-sharing › Tokens are long and different', () => {
  test('tokens have at least 22 characters, differ and hold neither slug', async ({ db }) => {
    const other = await createRecipe(db, { title: 'Pindasoep', author: 'Oma' });
    const a = await getOrCreateShare(db, oma, slug, now);
    const b = await getOrCreateShare(db, oma, other, now);
    assert.ok(a!.token.length >= 22 && b!.token.length >= 22);
    assert.notEqual(a!.token, b!.token);
    assert.ok(!a!.token.includes(slug) && !b!.token.includes(slug) && !a!.token.includes(other) && !b!.token.includes(other));
  });

  test('a token is url safe', async ({ db }) => {
    assert.match((await getOrCreateShare(db, oma, slug, now))!.token, /^[A-Za-z0-9_-]{22}$/);
  });
});

describe('recipe-sharing › Expired share is replaced', () => {
  test('a different link with no end date is shown and the old token is gone', async ({ db }) => {
    const old = await getOrCreateShare(db, oma, slug, now);
    await setExpiry(db, '2026-03-09T12:00:00Z');
    const fresh = await getOrCreateShare(db, oma, slug, now);
    assert.notEqual(fresh?.token, old?.token);
    assert.equal(fresh?.created, true);
    assert.equal(fresh?.expiresAt, null);
    assert.deepEqual((await rows(db)).results, [{ token: fresh?.token, expiresAt: null }]);
  });
});

describe('recipe-sharing › A live share is not replaced', () => {
  test('the same link is shown and the end date is unchanged', async ({ db }) => {
    const old = await getOrCreateShare(db, oma, slug, now);
    await setExpiry(db, '2026-03-11T12:00:00Z');
    const again = await getOrCreateShare(db, oma, slug, now);
    assert.deepEqual(again, { token: old?.token, expiresAt: '2026-03-11T12:00:00Z', created: false });
  });
});

describe('getOrCreateShare', () => {
  test('an unknown recipe has no share', async ({ db }) => {
    assert.equal(await getOrCreateShare(db, oma, 'does-not-exist', now), undefined);
  });

  test('an unknown member has no share', async ({ db }) => {
    assert.equal(await getOrCreateShare(db, 'vreemd@example.com', slug, now), undefined);
    assert.equal((await rows(db)).results.length, 0);
  });
});

describe('setShareExpiry', () => {
  test('stores the end date counted from now', async ({ db }) => {
    await getOrCreateShare(db, oma, slug, now);
    assert.deepEqual(await setShareExpiry(db, oma, slug, '7d', now), { expiresAt: '2026-03-17T12:00:00Z' });
    assert.equal((await rows(db)).results[0]?.expiresAt, '2026-03-17T12:00:00Z');
  });

  test('"never" removes the end date', async ({ db }) => {
    await getOrCreateShare(db, oma, slug, now);
    await setExpiry(db, '2026-03-11T12:00:00Z');
    assert.deepEqual(await setShareExpiry(db, oma, slug, 'never', now), { expiresAt: null });
    assert.equal((await rows(db)).results[0]?.expiresAt, null);
  });

  test("another member's share is refused and unchanged", async ({ db }) => {
    await getOrCreateShare(db, oma, slug, now);
    assert.equal(await setShareExpiry(db, opa, slug, '7d', now), undefined);
    assert.equal((await rows(db)).results[0]?.expiresAt, null);
  });

  test('an expired share is refused and unchanged', async ({ db }) => {
    await getOrCreateShare(db, oma, slug, now);
    await setExpiry(db, '2026-03-09T12:00:00Z');
    assert.equal(await setShareExpiry(db, oma, slug, '7d', now), undefined);
    assert.equal((await rows(db)).results[0]?.expiresAt, '2026-03-09T12:00:00Z');
  });

  test('a recipe without a share is refused', async ({ db }) => {
    assert.equal(await setShareExpiry(db, oma, slug, '7d', now), undefined);
  });
});
