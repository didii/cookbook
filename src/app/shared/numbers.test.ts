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

  test('reads whole numbers', () => {
    assert.equal(numberValue('0'), 0);
    assert.equal(numberValue('5'), 5);
    assert.equal(numberValue('1000'), 1000);
  });

  test('reads a decimal point', () => {
    assert.equal(numberValue('0.5'), 0.5);
    assert.equal(numberValue('1.000'), 1);
  });

  test('reads a fraction', () => {
    assert.equal(numberValue('1/2'), 0.5);
    assert.equal(numberValue('1 2/3'), 1 + 2 / 3);
  });

  test('returns undefined for a fraction with zero as denominator', () => {
    assert.equal(numberValue('1/0'), undefined);
  });

  test('returns undefined for text that is no number', () => {
    for (const text of ['abc', '2 abc', '1,5,5', '-3', '1e3', '.5', '']) assert.equal(numberValue(text), undefined, text);
  });
});
