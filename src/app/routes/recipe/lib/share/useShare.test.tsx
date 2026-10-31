import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test, vi } from 'vitest';
import type { ExpiryChoice } from '~app/shared/shareExpiry';
import { act, fireEvent, render, screen } from '~testing/dom';
import { useShare } from './useShare';

const realFetch = globalThis.fetch;
const realMatchMedia = window.matchMedia;
let calls: { url: string; body: string | undefined }[];
/** What the server answers per route: a status and a body. */
let answers: { create: { status: number; body: object }; expiry: { status: number; body: object } };

beforeEach(() => {
  calls = [];
  answers = {
    create: { status: 200, body: { token: 'tok', expiresAt: null, created: true } },
    expiry: { status: 200, body: { expiresAt: '2026-03-17T12:00:00Z' } },
  };
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  globalThis.fetch = ((url: string, init: RequestInit) => {
    calls.push({ url, body: init.body ? String(init.body) : undefined });
    const { status, body } = url.endsWith('/verloop') ? answers.expiry : answers.create;
    return Promise.resolve(Response.json(body, { status }));
  }) as typeof fetch;
});
afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = realFetch;
  window.matchMedia = realMatchMedia;
});

/** The hook shown in the DOM: its state as text, its functions as buttons. */
function Harness() {
  const share = useShare('soep');
  return (
    <div>
      <output data-testid="state">
        {JSON.stringify({
          state: share.state,
          token: share.token,
          expiresAt: share.expiresAt,
          picking: share.picking,
          choice: share.choice,
          check: share.check,
          error: share.error,
        })}
      </output>
      <button data-testid="change" aria-label="change" onClick={share.change} />
      <button data-testid="choose" aria-label="choose" onClick={() => void share.choose('7d' satisfies ExpiryChoice)} />
    </div>
  );
}
const state = () => JSON.parse(screen.getByTestId('state').textContent!) as Record<string, unknown>;
/** Renders and lets the create request finish. */
const show = async () => {
  render(<Harness />);
  await act(async () => {});
};
const choose = () => act(async () => void fireEvent.click(screen.getByTestId('choose')));
const reduceMotion = (reduce: boolean) => {
  window.matchMedia = ((query: string) => ({ matches: reduce && query.includes('reduce') })) as typeof window.matchMedia;
};

describe('useShare', () => {
  test('it creates the share on mount', async () => {
    await show();
    assert.deepEqual(calls, [{ url: '/recepten/soep/delen', body: undefined }]);
  });

  test('a share made by this open starts picking, on Nooit', async () => {
    await show();
    assert.deepEqual(state(), { state: 'ready', token: 'tok', expiresAt: null, picking: true, choice: 'never', check: 'off', error: false });
  });

  test('an existing share starts closed, without a choice', async () => {
    answers.create.body = { token: 'tok', expiresAt: '2026-03-17T12:00:00Z', created: false };
    await show();
    assert.equal(state().picking, false);
    assert.equal(state().choice, '');
    assert.equal(state().expiresAt, '2026-03-17T12:00:00Z');
  });

  test('Wijzig starts picking, still without a choice', async () => {
    answers.create.body = { token: 'tok', expiresAt: null, created: false };
    await show();
    fireEvent.click(screen.getByTestId('change'));
    assert.equal(state().picking, true);
    assert.equal(state().choice, '');
  });

  test('a refused create fails', async () => {
    answers.create = { status: 404, body: {} };
    await show();
    assert.equal(state().state, 'failed');
  });

  test('a choice posts the choice, not a date', async () => {
    await show();
    await choose();
    assert.deepEqual(calls[1], { url: '/recepten/soep/delen/verloop', body: 'expires=7d' });
  });

  test('a choice shows the end date the server answered', async () => {
    await show();
    await choose();
    assert.equal(state().expiresAt, '2026-03-17T12:00:00Z');
    assert.equal(state().choice, '7d');
  });
});

describe('recipe-sharing › Checkmark after a choice', () => {
  test('a checkmark is shown at once', async () => {
    await show();
    await choose();
    assert.equal(state().check, 'shown');
  });

  test('it fades and is gone after a few seconds', async () => {
    reduceMotion(false);
    await show();
    await choose();
    await act(async () => void vi.advanceTimersByTime(2500));
    assert.equal(state().check, 'fading');
    await act(async () => void vi.advanceTimersByTime(500));
    assert.equal(state().check, 'off');
  });

  test('it goes without fading for people who prefer reduced motion', async () => {
    reduceMotion(true);
    await show();
    await choose();
    await act(async () => void vi.advanceTimersByTime(2500));
    assert.equal(state().check, 'off');
  });

  test('a second choice restarts the time', async () => {
    reduceMotion(false);
    await show();
    await choose();
    await act(async () => void vi.advanceTimersByTime(2000));
    await choose();
    await act(async () => void vi.advanceTimersByTime(1000));
    assert.equal(state().check, 'shown');
  });
});

describe('recipe-sharing › A failed choice keeps the earlier date', () => {
  test('an error is shown', async () => {
    answers.expiry = { status: 400, body: {} };
    await show();
    await choose();
    assert.equal(state().error, true);
  });

  test('the end date and the choice are the earlier ones, with no checkmark', async () => {
    answers.expiry = { status: 404, body: {} };
    await show();
    await choose();
    assert.equal(state().expiresAt, null);
    assert.equal(state().choice, 'never');
    assert.equal(state().check, 'off');
  });

  test('a network failure counts as a failed choice', async () => {
    await show();
    globalThis.fetch = (() => Promise.reject(new TypeError('offline'))) as typeof fetch;
    await choose();
    assert.equal(state().error, true);
  });

  test('the next choice clears the error', async () => {
    answers.expiry = { status: 400, body: {} };
    await show();
    await choose();
    answers.expiry = { status: 200, body: { expiresAt: '2026-03-17T12:00:00Z' } };
    await choose();
    assert.equal(state().error, false);
  });
});
