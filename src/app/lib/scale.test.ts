import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultRules } from '~app/lib/rules';
import { formatNumber, nextMultiplier, parseNumber, scaleBody, scaleQuantity } from './scale';

const rows = [
  { id: '0', quantityText: '200 g', name: 'bloem' },
  { id: '1', quantityText: '2', name: 'eieren' },
];

test('recipe-scaling › Ingredient list scales', () => {
  assert.equal(scaleQuantity('200 g', 1.5), '300 g');
  assert.equal(scaleQuantity('2', 2), '4');
});

test('recipe-scaling › Amounts in step text scale', () => {
  assert.equal(scaleBody('Meng 200 g bloem met 2 eieren', 2, rows, defaultRules), 'Meng 400 g bloem met 4 eieren');
  // A unit alone is enough, also without a matching row.
  assert.equal(scaleBody('Voeg 1,5 el suiker toe', 2, [], defaultRules), 'Voeg 3 el suiker toe');
});

test('recipe-scaling › Times and temperatures do not scale', () => {
  assert.equal(scaleBody('Bak 20 minuten op 180 graden', 2, rows, defaultRules), 'Bak 20 minuten op 180 graden');
  assert.equal(scaleBody('Bak 1 uur op 200 °C', 2, rows, defaultRules), 'Bak 1 uur op 200 °C');
  assert.equal(scaleBody('Bak op 180°', 2, rows, defaultRules), 'Bak op 180°');
});

test('recipe-scaling › Ranges scale', () => {
  assert.equal(scaleQuantity('2-3 el', 2), '4-6 el');
  assert.equal(scaleBody('Neem 2-3 el olie', 2, [], defaultRules), 'Neem 4-6 el olie');
});

test('recipe-scaling › Quantity without a number', () => {
  assert.equal(scaleQuantity('', 3), '');
  assert.equal(scaleQuantity('snufje', 3), 'snufje');
});

test('recipe-scaling › Original at factor one', () => {
  assert.equal(scaleQuantity('1 ½ el', 1), '1 ½ el');
  assert.equal(scaleBody('Meng 1 ½ el suiker', 1, [], defaultRules), 'Meng 1 ½ el suiker');
  assert.equal(scaleQuantity('1 ½ el', 2), '3 el');
});

test('recipe-scaling › Long numbers are rounded', () => {
  assert.deepEqual([133.3333, 13.3333, 1.33333, 0.333333, 1234.5].map(formatNumber), ['133', '13,3', '1,33', '0,333', '1235']);
});

test('recipe-scaling › Round numbers stay round', () => {
  assert.deepEqual([2.5, 2.5000001, 300].map(formatNumber), ['2,5', '2,5', '300']);
});

test('fractions and glyphs scale', () => {
  assert.equal(scaleQuantity('1/2 tl', 3), '1,5 tl');
  assert.equal(scaleQuantity('½ tl', 1 / 3), '0,167 tl');
  assert.equal(scaleQuantity('1 2/3 kg', 3), '5 kg');
});

test('typed numbers', () => {
  assert.equal(parseNumber('2,5'), 2.5);
  assert.equal(parseNumber(' 1/3 '), 1 / 3);
  assert.equal(parseNumber('abc'), undefined);
  assert.equal(parseNumber('2 abc'), undefined);
});

test('the multiplier ladder', () => {
  const up = (from: number, n: number) => Array.from({ length: n }, () => (from = nextMultiplier(from, 1)));
  const down = (from: number, n: number) => Array.from({ length: n }, () => (from = nextMultiplier(from, -1)));
  assert.deepEqual(up(1, 6), [1.5, 2, 3, 4, 5, 6]);
  assert.deepEqual(down(1, 7), [1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8, 1 / 10, 1 / 10]);
  assert.equal(nextMultiplier(2.5, 1), 3);
  assert.equal(nextMultiplier(2.5, -1), 2);
  assert.equal(nextMultiplier(0.3333, 1), 0.5);
  assert.equal(nextMultiplier(0.3333, -1), 1 / 4);
  assert.equal(nextMultiplier(0.05, -1), 0.05);
  assert.equal(nextMultiplier(0.05, 1), 0.1);
  assert.equal(nextMultiplier(5, -1), 4);
  assert.equal(nextMultiplier(4.5, -1), 4);
  assert.equal(nextMultiplier(4.5, 1), 5);
});
