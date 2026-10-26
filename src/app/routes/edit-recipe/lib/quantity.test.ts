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

  test('a range has both values', () => {
    assert.deepEqual(parseQuantity('2-3 el', defaultRules), { quantityValue: 2, quantityValueMax: 3, quantityUnit: 'el' });
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

describe('parseQuantity › Loose unit matched ignoring case', () => {
  test('the unit is lowercase', () => {
    assert.deepEqual(parseQuantity('Scheutje', defaultRules), { quantityValue: 1, quantityUnit: 'scheutje' });
  });
});

describe('recipe-storage › Chip quantity word that is not a loose unit', () => {
  test('has no value and no unit', () => {
    assert.deepEqual(parseQuantity('el', defaultRules), {});
  });
});

describe('recipe-storage › A quantity can be a range', () => {
  test.each([
    '2-3 el',
    '2 - 3 el',
    '2–3 el',
    '2—3 el',
    '2 à 3 el',
    '2 tot 3 el',
    '2 tot en met 3 el',
    '2 of 3 el',
    'tussen 2 en 3 el',
    '2 to 3 el',
    '2 or 3 el',
  ])('%s gives 2, 3 and el', (text) => {
    assert.deepEqual(parseQuantity(text, defaultRules), { quantityValue: 2, quantityValueMax: 3, quantityUnit: 'el' });
  });

  test('fractions on either side', () => {
    assert.deepEqual(parseQuantity('½-1 el', defaultRules), { quantityValue: 0.5, quantityValueMax: 1, quantityUnit: 'el' });
    assert.deepEqual(parseQuantity('1 1/2 - 2 el', defaultRules), { quantityValue: 1.5, quantityValueMax: 2, quantityUnit: 'el' });
  });

  test('comma, slash and tilde make no range', () => {
    for (const text of ['2, 3 el', '2/3 el', '2~3 el']) assert.equal(parseQuantity(text, defaultRules).quantityValueMax, undefined);
  });

  test('a reversed range keeps its order', () => {
    assert.deepEqual(parseQuantity('3-2 el', defaultRules), { quantityValue: 3, quantityValueMax: 2, quantityUnit: 'el' });
  });
});

describe('recipe-storage › Chip range is read from its text on save', () => {
  test('the range gives value, maximum and unit', () => {
    assert.deepEqual(parseQuantity('2-3 el', defaultRules), { quantityValue: 2, quantityValueMax: 3, quantityUnit: 'el' });
  });
});
