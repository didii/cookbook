import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { render, screen } from '~testing/dom';
import { Plaid } from './Plaid';

const show = (strength = 0.45, cell = 32) => {
  render(<Plaid strength={strength} cell={cell} />);
  return screen.getByTestId('Plaid-layer');
};

describe('Plaid', () => {
  test('is hidden from assistive technology', () => {
    assert.equal(show().getAttribute('aria-hidden'), 'true');
  });

  test('has the red ground', async () => {
    assert.match(await cssFor(show().className), /background-color: var\(--color-red\)/);
  });

  test('draws its bands from ink only', () => {
    const layer = show();
    assert.deepEqual(layer.getAttribute('style')?.match(/--color-[a-z]+/g), ['--color-ink']);
    assert.doesNotMatch(layer.className, /--color-/);
  });

  test('takes the strength from its props', () => {
    assert.match(show(0.3).getAttribute('style') ?? '', /var\(--color-ink\) 30%/);
  });

  test('takes the cell size from its props', () => {
    assert.match(show(0.45, 40).getAttribute('style') ?? '', /--plaid-cell: 40px/);
  });
});
