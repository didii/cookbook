import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext } from '~app/shared/context.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route as UploadRoute } from './+types/PhotoUploadRoute';
import { action } from './PhotoUploadRoute';

const context = (photos: R2Bucket) => {
  const c = new RouterContextProvider();
  c.set(envContext, fake<Env>({ PHOTOS: photos }));
  return c;
};

const upload = (photos: R2Bucket, body: BodyInit, headers: HeadersInit = {}) =>
  action(
    fake<UploadRoute.ActionArgs>({
      request: new Request('http://localhost/foto', { method: 'POST', body, headers }),
      context: context(photos),
    }),
  ) as Promise<Response>;

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('upload', () => {
  test('answers 413 for a body over the limit', async ({ photos }) => {
    assert.equal((await upload(photos, new Uint8Array(2 * 1024 * 1024 + 1).fill(0xff))).status, 413);
  });

  test('answers 415 for something that is not an image', async ({ photos }) => {
    assert.equal((await upload(photos, 'plain text')).status, 415);
  });

  test('answers 413 before reading when the header claims too much', async ({ photos }) => {
    assert.equal((await upload(photos, jpeg, { 'Content-Length': String(3 * 1024 * 1024) })).status, 413);
  });
});
