import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'vitest';

const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');

describe('app.css tokens', () => {
  test('the rise animation lasts 0.22 s', () => {
    assert.match(css, /--animate-rise: rise 0\.22s/);
  });

  test('the hover tint is 5% ink over white', () => {
    assert.match(css, /--color-hover: color-mix\(in srgb, var\(--color-ink\) 5%, white\)/);
  });
});
