import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { findQuantities } from './quantities';

const rows = [
  { id: '1', quantityText: '500 g', name: 'bloem' },
  { id: '2', quantityText: '4', name: 'ei' },
  { id: '3', quantityText: '', name: 'olie' },
];
const find = (body: string) => findQuantities(body, rows, defaultRules);

describe('findQuantities', () => {
  test('finds a number followed by a unit of the rules', () => {
    assert.deepEqual(find('Meng 200 g bloem'), [{ startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' }]);
  });

  test('finds a number written before an ingredient name, without unit', () => {
    assert.deepEqual(find('Voeg 2 eieren toe'), [{ startIndex: 5, endIndex: 6, quantityValue: 2, quantityUnit: null }]);
  });

  test('finds both in text order', () => {
    assert.deepEqual(
      find('Meng 200 g bloem met 2 eieren').map((q) => [q.startIndex, q.quantityValue]),
      [
        [5, 200],
        [21, 2],
      ],
    );
  });

  test('reads a fraction and a decimal comma', () => {
    assert.deepEqual(
      find('Voeg ½ tl zout en 1,5 el olie toe').map((q) => q.quantityValue),
      [0.5, 1.5],
    );
  });

  test('keeps the unit of an amount that an ingredient name also points at', () => {
    assert.deepEqual(
      find('Voeg 100 g bloem toe').map((q) => q.quantityUnit),
      ['g'],
    );
  });

  test('finds no duration', () => {
    assert.deepEqual(find('Bak 20 minuten'), []);
  });

  test('finds no temperature', () => {
    assert.deepEqual(find('Bak op 180 graden'), []);
  });

  test('finds no range', () => {
    assert.deepEqual(find('Voeg 2-3 el olie toe'), []);
  });

  test('finds no range written with spaces around the dash', () => {
    assert.deepEqual(find('Voeg 2 - 3 el olie toe'), []);
    assert.deepEqual(find('Voeg 2 – 3 eieren toe'), []);
  });

  test('finds nothing in a number that is no amount', () => {
    assert.deepEqual(find('Doe dit 3 keer'), []);
  });
});

describe('parsing-rules › Scaling uses the stored units', () => {
  const rules = { ...defaultRules, units: [...defaultRules.units, 'kopje'] };

  test('a stored unit gives a stored amount', () => {
    assert.equal(findQuantities('doe 2 kopje bloem erbij', [], rules)[0]?.quantityValue, 2);
  });

  test('without the stored unit there is none', () => {
    assert.deepEqual(findQuantities('doe 2 kopje bloem erbij', [], defaultRules), []);
  });
});
