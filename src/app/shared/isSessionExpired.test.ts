import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test, vi } from 'vitest';
import { isSessionExpired } from './isSessionExpired';

const answer = (type: ResponseType) => (async () => ({ type }) as Response) as typeof fetch;

describe('isSessionExpired', () => {
  beforeEach(() => vi.stubGlobal('location', { href: 'http://localhost/' }));
  afterEach(() => vi.unstubAllGlobals());

  test('is true for a redirect', async () => {
    assert.equal(await isSessionExpired(answer('opaqueredirect')), true);
  });

  test('is false for a normal response', async () => {
    assert.equal(await isSessionExpired(answer('basic')), false);
  });

  test('is false when the request rejects', async () => {
    assert.equal(await isSessionExpired((async () => Promise.reject(new TypeError('offline'))) as typeof fetch), false);
  });

  test('probes the current page without following redirects', async () => {
    let init: RequestInit | undefined;
    await isSessionExpired((async (_url, i) => ((init = i), { type: 'basic' }) as Response) as typeof fetch);
    assert.equal(init?.redirect, 'manual');
  });
});
