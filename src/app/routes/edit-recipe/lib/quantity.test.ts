import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { parseQuantity } from './quantity';

describe('parseQuantity', () => {
  test('a number and a unit', () => {
    assert.deepEqual(parseQuantity('200 g'), { quantityValue: 200, quantityUnit: 'g' });
  });

  test('a number alone has no unit', () => {
    assert.deepEqual(parseQuantity('3'), { quantityValue: 3, quantityUnit: undefined });
  });

  test('a fraction', () => {
    assert.deepEqual(parseQuantity('½ tl'), { quantityValue: 0.5, quantityUnit: 'tl' });
  });

  test('the rest after the number is the unit, known or not', () => {
    assert.deepEqual(parseQuantity('1 klontje'), { quantityValue: 1, quantityUnit: 'klontje' });
  });

  test('a range has no value', () => {
    assert.deepEqual(parseQuantity('2-3 el'), {});
  });

  test('text without a leading number has no value', () => {
    assert.deepEqual(parseQuantity('een snufje'), {});
    assert.deepEqual(parseQuantity(''), {});
  });

  test('zero has no value', () => {
    assert.deepEqual(parseQuantity('0 g'), {});
  });
});
