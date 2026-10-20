import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { createUser, getUser } from './users';
import { redirectToWelcome } from './welcome';

let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

const rows = async (email: string) => (await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).all()).results.length;

// The root loader throws what redirectToWelcome returns, for every page document.
const welcome = async (email: string, path: string) =>
  (await redirectToWelcome(db, email, new URL(`http://localhost${path}`)))?.headers.get('Location');

test('users › First visit', async () => {
  assert.equal(await welcome('new@example.com', '/'), '/welkom?returnUrl=%2F');
});

test('users › Any other page on a first visit', async () => {
  assert.equal(await welcome('new@example.com', '/recepten/soep?stap=2'), '/welkom?returnUrl=%2Frecepten%2Fsoep%3Fstap%3D2');
});

test('the welcome screen itself is not redirected, so a new member can reach it', async () => {
  assert.equal(await welcome('new@example.com', '/welkom?returnUrl=%2F'), undefined);
  assert.equal(await welcome('new@example.com', '/Welkom'), undefined);
});

test('users › Returning member', async () => {
  await createUser(db, 'oma@example.com', 'Oma');
  assert.equal(await welcome('oma@example.com', '/'), undefined);
  assert.equal(await welcome('oma@example.com', '/recepten/soep'), undefined);
});

test('users › Same address in another case', async () => {
  await createUser(db, 'Mama@Example.com', 'Mama');
  assert.equal(await welcome('mama@example.com', '/'), undefined);
  await createUser(db, 'mama@example.com', 'Mam');
  assert.equal(await rows('MAMA@EXAMPLE.COM'), 1);
});

test('being redirected stores nobody', async () => {
  await welcome('stored@example.com', '/');
  assert.equal(await getUser(db, 'stored@example.com'), undefined);
});
