import assert from 'node:assert/strict';
import { afterEach, describe, test, vi } from 'vitest';
import { fetchImage } from './fetchImage';

afterEach(() => vi.unstubAllGlobals());

describe('fetchImage', () => {
  test('posts the address as JSON to the image endpoint', async () => {
    const stub = vi.fn(async () => new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } }));
    vi.stubGlobal('fetch', stub);
    await fetchImage('https://example.com/a.png');
    const [url, init] = stub.mock.calls[0] as unknown as [string, RequestInit];
    assert.equal(url, '/importeren/foto');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body as string), { url: 'https://example.com/a.png' });
  });

  test('returns the image bytes with their type', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } }));
    const blob = await fetchImage('https://example.com/a.png');
    assert.equal(blob?.size, 3);
    assert.equal(blob?.type, 'image/png');
  });

  test('a refused request gives undefined', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 415 }));
    assert.equal(await fetchImage('https://example.com/a.png'), undefined);
  });

  test('a network error gives undefined', async () => {
    vi.stubGlobal('fetch', async () => Promise.reject(new TypeError('offline')));
    assert.equal(await fetchImage('https://example.com/a.png'), undefined);
  });
});
