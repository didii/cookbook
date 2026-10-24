import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { numberValue } from './numbers';

describe('numberValue', () => {
  test('reads a decimal comma', () => {
    assert.equal(numberValue('1,5'), 1.5);
  });

  test('reads a fraction glyph', () => {
    assert.equal(numberValue('1 ½'), 1.5);
  });
});
