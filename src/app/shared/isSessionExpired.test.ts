import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { isSessionExpired } from './isSessionExpired';

const url = 'http://localhost/recipes/1';
const answer = (type: ResponseType) => (async () => ({ type }) as Response) as typeof fetch;

describe('isSessionExpired', () => {
  test('is true for a redirect', async () => {
    assert.equal(await isSessionExpired(url, answer('opaqueredirect')), true);
  });

  test('is false for a normal response', async () => {
    assert.equal(await isSessionExpired(url, answer('basic')), false);
  });

  test('is false when the request rejects', async () => {
    assert.equal(await isSessionExpired(url, (async () => Promise.reject(new TypeError('offline'))) as typeof fetch), false);
  });

  test('probes the given page with HEAD and without following redirects', async () => {
    let probed: [unknown, RequestInit | undefined] | undefined;
    await isSessionExpired(url, (async (u, i) => ((probed = [u, i]), { type: 'basic' }) as Response) as typeof fetch);
    assert.equal(probed?.[0], url);
    assert.equal(probed?.[1]?.method, 'HEAD');
    assert.equal(probed?.[1]?.redirect, 'manual');
  });
});
