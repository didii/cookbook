import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { afterEach, describe, test, vi } from 'vitest';
import { importAllowContext, userEmailContext } from '~app/shared/context.server';
import { fake } from '~testing/fake';
import type { Route } from './+types/ImportImageFetchRoute';
import { action } from './ImportImageFetchRoute';

afterEach(() => vi.unstubAllGlobals());

const asked = (url: string) => {
  const context = new RouterContextProvider();
  context.set(userEmailContext, 'mum@example.com');
  context.set(importAllowContext, async () => true);
  return action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/importeren/foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }),
      context,
    }),
  ) as Promise<Response>;
};

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('recipe-import › Image is fetched', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    test(`${type} bytes are returned`, async () => {
      vi.stubGlobal('fetch', async () => new Response(jpeg, { headers: { 'Content-Type': type } }));
      const response = await asked('https://example.com/a');
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), type);
      assert.deepEqual(new Uint8Array(await response.arrayBuffer()), jpeg);
    });
  }

  test('a page is not accepted as an image', async () => {
    vi.stubGlobal('fetch', async () => new Response('<p>', { headers: { 'Content-Type': 'text/html' } }));
    assert.equal((await asked('https://example.com/')).status, 415);
  });
});
