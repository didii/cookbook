import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { storePhoto } from '~app/shared/photos.server';
import { test } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route as FileRoute } from './+types/PhotoFetchRoute';
import { loader } from './PhotoFetchRoute';

let photos: R2Bucket;

test.beforeAll(({ testDb }) => {
  ({ photos } = testDb);
});

const context = () => {
  const c = new RouterContextProvider();
  c.set(envContext, fake<Env>({ PHOTOS: photos }));
  return c;
};

const serve = (file: string) => loader(fake<FileRoute.LoaderArgs>({ params: { file }, context: context() })) as Promise<Response>;

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('recipe-photo › Photo is served', () => {
  const served = async () => {
    const stored = await storePhoto(photos, jpeg.buffer);
    assert.ok('path' in stored);
    return serve(stored.path.slice('/foto/'.length));
  };

  test('answers 200 as image/jpeg', async () => {
    const res = await served();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'image/jpeg');
  });

  test('is cached for a year and immutable', async () => {
    assert.match((await served()).headers.get('Cache-Control') ?? '', /max-age=31536000.*immutable/);
  });

  test('is not sniffed', async () => {
    assert.equal((await served()).headers.get('X-Content-Type-Options'), 'nosniff');
  });

  test('has an ETag', async () => {
    assert.ok((await served()).headers.get('ETag'));
  });

  test('has the uploaded bytes', async () => {
    assert.deepEqual(new Uint8Array(await (await served()).arrayBuffer()), jpeg);
  });
});

describe('recipe-photo › Unknown photo', () => {
  test('answers 404', async () => {
    assert.equal((await serve('00000000-0000-4000-8000-000000000000.jpg')).status, 404);
  });
});
