import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { test } from '~testing/db';
import { createUser, getUser } from './users.server';
import { redirectToWelcome } from './welcome.server';

let db: D1Database;

test.beforeAll(({ testDb }) => {
  ({ db } = testDb);
});

const rows = async (email: string) => (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

// The root loader throws what redirectToWelcome returns, for every page document.
const welcome = async (email: string, path: string) =>
  redirectToWelcome(await getUser(db, email), new URL(`http://localhost${path}`))?.headers.get('Location');

describe('users › First visit', () => {
  test('redirects to the welcome screen, returning to the home page', async () => {
    assert.equal(await welcome('new@example.com', '/'), '/welkom?returnUrl=%2F');
  });
});

describe('users › Any other page on a first visit', () => {
  test('redirects to the welcome screen, returning to that page', async () => {
    assert.equal(await welcome('new@example.com', '/recepten/soep?stap=2'), '/welkom?returnUrl=%2Frecepten%2Fsoep%3Fstap%3D2');
  });
});

describe('redirectToWelcome', () => {
  describe('the welcome screen itself', () => {
    for (const path of ['/welkom?returnUrl=%2F', '/Welkom'])
      test(`${path} is not redirected, so a new member can reach it`, async () => {
        assert.equal(await welcome('new@example.com', path), undefined);
      });
  });

  describe('data requests', () => {
    test('a data request of the welcome screen is not redirected', async () => {
      assert.equal(await welcome('new@example.com', '/welkom.data?returnUrl=%2F'), undefined);
    });

    test('a data request of a page returns to that page', async () => {
      assert.equal(await welcome('new@example.com', '/recepten/soep.data?stap=2&_routes=root'), '/welkom?returnUrl=%2Frecepten%2Fsoep%3Fstap%3D2');
    });

    test('a data request of the root returns to the home page', async () => {
      assert.equal(await welcome('new@example.com', '/_root.data'), '/welkom?returnUrl=%2F');
    });
  });

  test('being redirected stores nobody', async () => {
    await welcome('stored@example.com', '/');
    assert.equal(await getUser(db, 'stored@example.com'), undefined);
  });
});

describe('users › Returning member', () => {
  test('is not redirected from the home page', async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    assert.equal(await welcome('oma@example.com', '/'), undefined);
  });

  test('is not redirected from another page', async () => {
    await createUser(db, 'oma@example.com', 'Oma');
    assert.equal(await welcome('oma@example.com', '/recepten/soep'), undefined);
  });
});

describe('users › Same address in another case', () => {
  test('is the same member', async () => {
    await createUser(db, 'Mama@Example.com', 'Mama');
    assert.equal(await welcome('mama@example.com', '/'), undefined);
  });

  test('is not stored twice', async () => {
    await createUser(db, 'Mama@Example.com', 'Mama');
    await createUser(db, 'mama@example.com', 'Mam');
    assert.equal(await rows('MAMA@EXAMPLE.COM'), 1);
  });
});
