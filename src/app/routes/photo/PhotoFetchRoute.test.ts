import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~app/shared/context.server';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route as FileRoute } from './+types/PhotoFetchRoute';
import type { Route as UploadRoute } from './+types/PhotoUploadRoute';
import { loader } from './PhotoFetchRoute';
import { action } from './PhotoUploadRoute';

let photos: R2Bucket;
let dispose: () => Promise<void>;

before(async () => {
  ({ photos, dispose } = await createTestDb());
});
after(() => dispose());

const context = () => {
  const c = new RouterContextProvider();
  c.set(envContext, fake<Env>({ PHOTOS: photos }));
  return c;
};

const upload = (body: BodyInit, headers: HeadersInit = {}) =>
  action(
    fake<UploadRoute.ActionArgs>({
      request: new Request('http://localhost/foto', { method: 'POST', body, headers }),
      context: context(),
    }),
  ) as Promise<Response>;

const serve = (file: string) => loader(fake<FileRoute.LoaderArgs>({ params: { file }, context: context() })) as Promise<Response>;

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('recipe-photo › Photo is served', () => {
  const served = async () => {
    const { path } = (await (await upload(jpeg)).json()) as { path: string };
    return serve(path.slice('/foto/'.length));
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
