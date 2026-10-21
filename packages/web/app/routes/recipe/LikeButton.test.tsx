import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { act, fireEvent, render, screen } from '~testing/dom';
import { LikeButton } from './LikeButton';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});
const heart = () => screen.getByTestId('LikeButton-heart');
const stub = (answer: () => Promise<Response>) => {
  const sent: { url: string; body: string }[] = [];
  globalThis.fetch = ((url: string, init: RequestInit) => {
    sent.push({ url, body: String(init.body) });
    return answer();
  }) as typeof fetch;
  return sent;
};

test('recipe-like › Recipe not liked', () => {
  render(<LikeButton slug="soep" liked={false} />);
  assert.equal(heart().getAttribute('aria-pressed'), 'false');
  assert.equal(heart().getAttribute('aria-label'), 'Markeer als favoriet');
  assert.ok(heart().classList.contains('bg-white') && heart().classList.contains('size-11'));
  assert.ok(!heart().querySelector('svg')!.classList.contains('fill-current'));
});

test('recipe-like › Recipe liked', () => {
  render(<LikeButton slug="soep" liked />);
  assert.equal(heart().getAttribute('aria-pressed'), 'true');
  assert.equal(heart().getAttribute('aria-label'), 'Verwijder uit favorieten');
  assert.ok(heart().classList.contains('bg-red'));
  assert.ok(heart().querySelector('svg')!.classList.contains('fill-current'));
});

test('pressing the heart changes it at once and states the wanted value', async () => {
  const sent = stub(() => Promise.resolve(new Response(null, { status: 204 })));
  render(<LikeButton slug="soep" liked={false} />);
  await act(async () => {
    fireEvent.click(heart());
  });
  assert.deepEqual(sent, [{ url: '/recepten/soep/favoriet', body: 'liked=true' }]);
  assert.equal(heart().getAttribute('aria-pressed'), 'true');
  await act(async () => {
    fireEvent.click(heart());
  });
  assert.equal(sent[1]!.body, 'liked=false');
  assert.equal(heart().getAttribute('aria-pressed'), 'false');
});

test('recipe-like › Like cannot be saved', async () => {
  stub(() => Promise.resolve(new Response(null, { status: 500 })));
  render(<LikeButton slug="soep" liked={false} />);
  await act(async () => {
    fireEvent.click(heart());
  });
  assert.equal(heart().getAttribute('aria-pressed'), 'false');
  // A request that never arrives goes back as well.
  stub(() => Promise.reject(new TypeError('offline')));
  await act(async () => {
    fireEvent.click(heart());
  });
  assert.equal(heart().getAttribute('aria-pressed'), 'false');
});
