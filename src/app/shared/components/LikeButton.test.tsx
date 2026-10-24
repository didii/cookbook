import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { act, fireEvent, render, screen } from '~testing/dom';
import { LikeButton } from './LikeButton';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});
const leaf = () => screen.getByTestId('LikeButton-leaf');
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
    fireEvent.click(leaf());
  });

describe('recipe-like › Recipe not liked', () => {
  test('the leaf is not pressed', () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.equal(leaf().getAttribute('aria-pressed'), 'false');
  });

  test('the label offers to mark it as favourite', () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.equal(leaf().getAttribute('aria-label'), 'Markeer als favoriet');
  });

  test('the button is white', async () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.match(await cssFor(leaf().className), /background-color: var\(--color-white\)/);
  });

  test('the button is 44px wide and high', async () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.match(await cssFor(leaf().className), /width: calc\(var\(--spacing\) \* 11\);\s*height: calc\(var\(--spacing\) \* 11\)/);
  });

  test('the leaf is an outline', async () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.doesNotMatch(await cssFor(leaf().querySelector('svg')!.getAttribute('class') ?? ''), /fill: currentcolor/);
  });
});

describe('recipe-like › Recipe liked', () => {
  test('the leaf is pressed', () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.equal(leaf().getAttribute('aria-pressed'), 'true');
  });

  test('the label offers to remove it from favourites', () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.equal(leaf().getAttribute('aria-label'), 'Verwijder uit favorieten');
  });

  test('the button is red', async () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.match(await cssFor(leaf().className), /background-color: var\(--color-red\)/);
  });

  test('the leaf is filled', async () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.match(await cssFor(leaf().querySelector('svg')!.getAttribute('class') ?? ''), /fill: currentcolor/);
  });
});

describe('LikeButton', () => {
  test('pressing the leaf changes it at once and states the wanted value', async () => {
    const sent = stub(() => Promise.resolve(new Response(null, { status: 204 })));
    render(<LikeButton slug="soep" initialLiked={false} />);
    await press();
    assert.deepEqual(sent, [{ url: '/recepten/soep/favoriet', body: 'liked=true' }]);
    assert.equal(leaf().getAttribute('aria-pressed'), 'true');
  });

  test('pressing a liked leaf states liked=false and unpresses it', async () => {
    const sent = stub(() => Promise.resolve(new Response(null, { status: 204 })));
    render(<LikeButton slug="soep" initialLiked />);
    await press();
    assert.equal(sent[0]!.body, 'liked=false');
    assert.equal(leaf().getAttribute('aria-pressed'), 'false');
  });
});

describe('recipe-like › Like cannot be saved', () => {
  test('a refused save goes back', async () => {
    stub(() => Promise.resolve(new Response(null, { status: 500 })));
    render(<LikeButton slug="soep" initialLiked={false} />);
    await press();
    assert.equal(leaf().getAttribute('aria-pressed'), 'false');
  });

  test('a request that never arrives goes back as well', async () => {
    stub(() => Promise.reject(new TypeError('offline')));
    render(<LikeButton slug="soep" initialLiked={false} />);
    await press();
    assert.equal(leaf().getAttribute('aria-pressed'), 'false');
  });
});

describe('recipe-like › Leaf reacts to the pointer', () => {
  test('an unliked leaf has a hover colour', async () => {
    render(<LikeButton slug="soep" initialLiked={false} />);
    assert.match(await cssFor(leaf().className), /hover[^{]*\{[^}]*background-color: var\(--color-yel\)/);
  });

  test('a liked leaf has a hover colour', async () => {
    render(<LikeButton slug="soep" initialLiked />);
    assert.match(await cssFor(leaf().className), /hover[^{]*\{[^}]*background-color: color-mix\(/);
  });
});

describe('LikeButton onSaved', () => {
  test('is called after the server accepted the change', async () => {
    stub(() => Promise.resolve(new Response(null, { status: 204 })));
    let saved = 0;
    render(<LikeButton slug="soep" initialLiked={false} onSaved={() => saved++} />);
    await press();
    assert.equal(saved, 1);
  });

  test('is not called when the save fails', async () => {
    stub(() => Promise.resolve(new Response(null, { status: 500 })));
    let saved = 0;
    render(<LikeButton slug="soep" initialLiked={false} onSaved={() => saved++} />);
    await press();
    assert.equal(saved, 0);
  });
});
