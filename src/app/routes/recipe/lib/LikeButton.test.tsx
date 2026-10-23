import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
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
const press = () =>
  act(async () => {
    fireEvent.click(heart());
  });

describe('recipe-like › Recipe not liked', () => {
  test('the heart is not pressed', () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.equal(heart().getAttribute('aria-pressed'), 'false');
  });

  test('the label offers to mark it as favourite', () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.equal(heart().getAttribute('aria-label'), 'Markeer als favoriet');
  });

  test('the button is white and 44px', () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.ok(heart().classList.contains('bg-white') && heart().classList.contains('size-11'));
  });

  test('the heart is an outline', () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.ok(!heart().querySelector('svg')!.classList.contains('fill-current'));
  });
});

describe('recipe-like › Recipe liked', () => {
  test('the heart is pressed', () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.equal(heart().getAttribute('aria-pressed'), 'true');
  });

  test('the label offers to remove it from favourites', () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.equal(heart().getAttribute('aria-label'), 'Verwijder uit favorieten');
  });

  test('the button is red', () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.ok(heart().classList.contains('bg-red'));
  });

  test('the heart is filled', () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.ok(heart().querySelector('svg')!.classList.contains('fill-current'));
  });
});

describe('LikeButton', () => {
  test('pressing the heart changes it at once and states the wanted value', async () => {
    const sent = stub(() => Promise.resolve(new Response(null, { status: 204 })));
    render(<LikeButton slug="soep" initialLiked={false} />);
    await press();
    assert.deepEqual(sent, [{ url: '/recepten/soep/favoriet', body: 'liked=true' }]);
    assert.equal(heart().getAttribute('aria-pressed'), 'true');
  });

  test('pressing a liked heart states liked=false and unpresses it', async () => {
    const sent = stub(() => Promise.resolve(new Response(null, { status: 204 })));
    render(<LikeButton slug="soep" initialLiked />);
    await press();
    assert.equal(sent[0]!.body, 'liked=false');
    assert.equal(heart().getAttribute('aria-pressed'), 'false');
  });
});

describe('recipe-like › Like cannot be saved', () => {
  test('a refused save goes back', async () => {
    stub(() => Promise.resolve(new Response(null, { status: 500 })));
    render(<LikeButton slug="soep" initialLiked={false} />);
    await press();
    assert.equal(heart().getAttribute('aria-pressed'), 'false');
  });

  test('a request that never arrives goes back as well', async () => {
    stub(() => Promise.reject(new TypeError('offline')));
    render(<LikeButton slug="soep" initialLiked={false} />);
    await press();
    assert.equal(heart().getAttribute('aria-pressed'), 'false');
  });
});
