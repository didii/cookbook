import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~app/.server/context';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route as FileRoute } from './+types/file';
import type { Route as UploadRoute } from './+types/upload';
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

test('recipe-photo › Photo is served', async () => {
  const { path } = (await (await upload(jpeg)).json()) as { path: string };
  const res = await serve(path.slice('/foto/'.length));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'image/jpeg');
  assert.match(res.headers.get('Cache-Control') ?? '', /max-age=31536000.*immutable/);
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.ok(res.headers.get('ETag'));
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), jpeg);
});

test('recipe-photo › Unknown photo', async () => {
  assert.equal((await serve('00000000-0000-4000-8000-000000000000.jpg')).status, 404);
});

test('upload answers 413 for a body over the limit', async () => {
  assert.equal((await upload(new Uint8Array(2 * 1024 * 1024 + 1).fill(0xff))).status, 413);
});

test('upload answers 415 for something that is not an image', async () => {
  assert.equal((await upload('plain text')).status, 415);
});

test('upload answers 413 before reading when the header claims too much', async () => {
  assert.equal((await upload(jpeg, { 'Content-Length': String(3 * 1024 * 1024) })).status, 413);
});
