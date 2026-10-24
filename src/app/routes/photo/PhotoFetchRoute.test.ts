import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { storePhoto } from '~app/shared/photos.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route as FileRoute } from './+types/PhotoFetchRoute';
import { loader } from './PhotoFetchRoute';

const context = (photos: R2Bucket) => {
  const c = new RouterContextProvider();
  c.set(envContext, fake<Env>({ PHOTOS: photos }));
  return c;
};

const serve = (photos: R2Bucket, file: string) =>
  loader(fake<FileRoute.LoaderArgs>({ params: { file }, context: context(photos) })) as Promise<Response>;

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('recipe-photo › Photo is served', () => {
  const served = async (photos: R2Bucket) => {
    const stored = await storePhoto(photos, jpeg.buffer);
    assert.ok('path' in stored);
    return serve(photos, stored.path.slice('/foto/'.length));
  };

  test('answers 200 as image/jpeg', async ({ photos }) => {
    const res = await served(photos);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'image/jpeg');
  });

  test('is cached for a year and immutable', async ({ photos }) => {
    assert.match((await served(photos)).headers.get('Cache-Control') ?? '', /max-age=31536000.*immutable/);
  });

  test('is not sniffed', async ({ photos }) => {
    assert.equal((await served(photos)).headers.get('X-Content-Type-Options'), 'nosniff');
  });

  test('has an ETag', async ({ photos }) => {
    assert.ok((await served(photos)).headers.get('ETag'));
  });

  test('has the uploaded bytes', async ({ photos }) => {
    assert.deepEqual(new Uint8Array(await (await served(photos)).arrayBuffer()), jpeg);
  });
});

describe('recipe-photo › Unknown photo', () => {
  test('answers 404', async ({ photos }) => {
    assert.equal((await serve(photos, '00000000-0000-4000-8000-000000000000.jpg')).status, 404);
  });
});
