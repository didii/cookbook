import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { createUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/AdminPhotosPageRoute';
import { action, loader } from './AdminPhotosPageRoute';

// Real loader and action against an in-memory D1 and R2.
test.beforeEach(async ({ db }) => {
  await createUser(db, 'user@example.com', 'Uli');
  for (const role of ['admin', 'superadmin'])
    await db.prepare('INSERT INTO users (email, calling_name, role) VALUES (?, ?, ?)').bind(`${role}@example.com`, role, role).run();
});

const photo = '00000000-0000-4000-8000-000000000001.jpg';
const contextFor = (db: D1Database, photos: R2Bucket, email: string) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db, PHOTOS: photos }));
  context.set(userEmailContext, email);
  return context;
};
const open = (db: D1Database, photos: R2Bucket, email: string, search = '') =>
  loader(fake<Route.LoaderArgs>({ request: new Request(`http://localhost/beheer/fotos${search}`), context: contextFor(db, photos, email) }));
const send = (db: D1Database, photos: R2Bucket, email: string) =>
  action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/beheer/fotos', { method: 'POST', body: new URLSearchParams({ naam: photo }) }),
      context: contextFor(db, photos, email),
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

describe('orphaned-photos › Admin opens the page', () => {
  for (const role of ['admin', 'superadmin'])
    test(`${role} gets the photos`, async ({ db, photos }) => {
      await photos.put(`photos/${photo}`, new Uint8Array(3));
      const result = await open(db, photos, `${role}@example.com`, '?ongebruikt=0&ouder=0');
      assert.deepEqual(
        result.photos.map((p) => p.name),
        [photo],
      );
    });
});

describe('orphaned-photos › User opens the page', () => {
  test('is refused with 403', async ({ db, photos }) => {
    assert.equal(await refused(open(db, photos, 'user@example.com')), 403);
  });

  // Someone without a user row is no admin either.
  test('someone without a user row is refused with 403', async ({ db, photos }) => {
    assert.equal(await refused(open(db, photos, 'nobody@example.com')), 403);
  });
});

describe('orphaned-photos › User sends a delete', () => {
  test('is refused with 403', async ({ db, photos }) => {
    await photos.put(`photos/${photo}`, new Uint8Array(3));
    assert.equal(await refused(send(db, photos, 'user@example.com')), 403);
  });

  test('deletes nothing', async ({ db, photos }) => {
    await photos.put(`photos/${photo}`, new Uint8Array(3));
    await refused(send(db, photos, 'user@example.com'));
    assert.equal((await photos.list()).objects.length, 1);
  });
});

describe('orphaned-photos › Filters are in the address', () => {
  test('both are on without parameters', async ({ db, photos }) => {
    assert.deepEqual((await open(db, photos, 'admin@example.com')).filters, { onlyUnused: true, onlyOld: true });
  });

  test('the parameters turn them off', async ({ db, photos }) => {
    assert.deepEqual((await open(db, photos, 'admin@example.com', '?ongebruikt=0&ouder=0')).filters, { onlyUnused: false, onlyOld: false });
  });
});

describe('orphaned-photos › Chosen photos are deleted', () => {
  test('the action deletes the named photos for an admin', async ({ db, photos }) => {
    await photos.put(`photos/${photo}`, new Uint8Array(3));
    const answer = await send(db, photos, 'admin@example.com');
    assert.deepEqual(answer.data, { deleted: 1, kept: [] });
    assert.equal((await photos.list()).objects.length, 0);
  });
});
