import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { numberValue, rangePattern, tussen } from './numbers';

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

describe('rangePattern', () => {
  const whole = new RegExp(String.raw`^${tussen}${rangePattern}$`, 'u');
  const read = (text: string) => {
    const m = whole.exec(text);
    return m && [numberValue(m[1]), numberValue(m[2])];
  };

  test.each(['2-3', '2 - 3', '2–3', '2—3', '2 à 3', '2 tot 3', '2 tot en met 3', '2 of 3', 'tussen 2 en 3', '2 to 3', '2 or 3'])(
    'reads %s',
    (text) => {
      assert.deepEqual(read(text), [2, 3]);
    },
  );

  test('reads fractions and glyphs on each side', () => {
    assert.deepEqual(read('½-1'), [0.5, 1]);
    assert.deepEqual(read('1 1/2 - 2'), [1.5, 2]);
  });

  test('keeps the typed order', () => {
    assert.deepEqual(read('3-2'), [3, 2]);
  });

  test.each(['2, 3', '2/3', '2~3', '2 en 3', '2'])('refuses %s', (text) => {
    assert.equal(read(text), null);
  });
});
