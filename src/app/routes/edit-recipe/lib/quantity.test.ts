import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { parseQuantity } from './quantity';

describe('parseQuantity', () => {
  test('a number and a unit', () => {
    assert.deepEqual(parseQuantity('200 g', defaultRules), { quantityValue: 200, quantityUnit: 'g' });
  });

  test('a number alone has no unit', () => {
    assert.deepEqual(parseQuantity('3', defaultRules), { quantityValue: 3, quantityUnit: undefined });
  });

  test('a fraction', () => {
    assert.deepEqual(parseQuantity('½ tl', defaultRules), { quantityValue: 0.5, quantityUnit: 'tl' });
  });

  test('the rest after the number is the unit, known or not', () => {
    assert.deepEqual(parseQuantity('1 klontje', defaultRules), { quantityValue: 1, quantityUnit: 'klontje' });
  });

  test('a range has no value', () => {
    assert.deepEqual(parseQuantity('2-3 el', defaultRules), {});
  });

  test('text without a leading number has no value', () => {
    assert.deepEqual(parseQuantity('een snufje', defaultRules), {});
    assert.deepEqual(parseQuantity('', defaultRules), {});
  });

  test('zero has no value', () => {
    assert.deepEqual(parseQuantity('0 g', defaultRules), {});
  });
});

describe('recipe-storage › Chip quantity that is a loose unit', () => {
  test('is value 1 with that unit', () => {
    assert.deepEqual(parseQuantity('scheutje', defaultRules), { quantityValue: 1, quantityUnit: 'scheutje' });
  });
});

describe('recipe-storage › Chip quantity word that is not a loose unit', () => {
  test('has no value and no unit', () => {
    assert.deepEqual(parseQuantity('el', defaultRules), {});
  });
});
