import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { afterEach, describe, test, vi } from 'vitest';
import { importAllowContext, userEmailContext } from '~app/shared/context.server';
import { fake } from '~testing/fake';
import type { Route } from './+types/ImportPageFetchRoute';
import { action } from './ImportPageFetchRoute';

afterEach(() => vi.unstubAllGlobals());

const asked = (url: string) => {
  const context = new RouterContextProvider();
  context.set(userEmailContext, 'mum@example.com');
  context.set(importAllowContext, async () => true);
  return action(
    fake<Route.ActionArgs>({
      request: new Request('http://localhost/importeren/pagina', { method: 'POST', body: JSON.stringify({ url }) }),
      context,
    }),
  ) as Promise<Response>;
};

describe('recipe-import › Page is fetched', () => {
  test('the HTML of an https page is returned', async () => {
    vi.stubGlobal('fetch', async () => new Response('<h1>Soep</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    const response = await asked('https://example.com/soep');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<h1>Soep</h1>');
  });

  test('an image is not accepted as a page', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } }));
    assert.equal((await asked('https://example.com/a.png')).status, 415);
  });
});
