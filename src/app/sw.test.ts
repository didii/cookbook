import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, test } from 'vitest';

const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');

/** Runs the worker against a stand-in `self` (no `caches`, so touching it would throw) and returns what it listens to. */
const load = () => {
  const listeners: Record<string, (event: unknown) => void> = {};
  runInNewContext(source, { self: { addEventListener: (type: string, listener: (event: unknown) => void) => (listeners[type] = listener) } });
  return listeners;
};

describe('installable-app › Requests are not answered by the service worker', () => {
  test('it listens to fetch', () => {
    assert.equal(typeof load().fetch, 'function');
  });

  test('it does not respond to a request', () => {
    let responded = false;
    load().fetch!({ respondWith: () => (responded = true), request: { url: 'http://localhost/' } });
    assert.equal(responded, false);
  });

  test('it stores nothing', () => {
    // The stand-in has no `caches`: a worker that used the cache API would throw here.
    assert.doesNotThrow(() => load().fetch!({ request: { url: 'http://localhost/' } }));
  });
});
