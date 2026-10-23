import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { RouterContextProvider } from 'react-router';
import { envContext } from '~app/shared/context.server';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import type { Route as UploadRoute } from './+types/PhotoUploadRoute';
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

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('upload', () => {
  test('answers 413 for a body over the limit', async () => {
    assert.equal((await upload(new Uint8Array(2 * 1024 * 1024 + 1).fill(0xff))).status, 413);
  });

  test('answers 415 for something that is not an image', async () => {
    assert.equal((await upload('plain text')).status, 415);
  });

  test('answers 413 before reading when the header claims too much', async () => {
    assert.equal((await upload(jpeg, { 'Content-Length': String(3 * 1024 * 1024) })).status, 413);
  });
});
