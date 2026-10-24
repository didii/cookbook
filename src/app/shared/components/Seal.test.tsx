import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { Seal } from './Seal';

describe('Seal', () => {
  test('shows the image of the given seal', () => {
    render(<Seal id="fu" />);
    assert.equal(screen.getByTestId('Seal-image').getAttribute('src'), '/img/seal/fu.svg');
  });

  test('is decorative', () => {
    render(<Seal id="fu" />);
    assert.equal(screen.getByTestId('Seal-image').getAttribute('alt'), '');
  });
});
