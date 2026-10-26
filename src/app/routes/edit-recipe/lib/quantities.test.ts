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

  test('finds nothing in a number that is no amount', () => {
    assert.deepEqual(find('Doe dit 3 keer'), []);
  });
});

describe('parsing-rules › Saving uses the stored units', () => {
  const rules = { ...defaultRules, units: [...defaultRules.units, 'kopje'] };

  test('a stored unit gives a stored amount with that unit', () => {
    assert.deepEqual(findQuantities('doe 2 kopje rijst erbij', [], rules), [{ startIndex: 4, endIndex: 5, quantityValue: 2, quantityUnit: 'kopje' }]);
  });

  test('without the stored unit there is none', () => {
    assert.deepEqual(findQuantities('doe 2 kopje rijst erbij', [], defaultRules), []);
  });
});

describe('recipe-scaling › Times and temperatures do not scale', () => {
  test('minutes and degrees in words are no stored amount', () => {
    assert.deepEqual(find('Bak 20 minuten op 180 graden'), []);
  });

  test('hours and °C are no stored amount', () => {
    assert.deepEqual(find('Bak 1 uur op 200 °C'), []);
  });

  test('a bare degree sign is no stored amount', () => {
    assert.deepEqual(find('Bak op 180°'), []);
  });
});

describe('recipe-storage › Unit on both sides is no range', () => {
  test('two single amounts, neither with a maximum', () => {
    assert.deepEqual(find('Voeg 2 el - 3 el olie toe'), [
      { startIndex: 5, endIndex: 6, quantityValue: 2, quantityUnit: 'el' },
      { startIndex: 12, endIndex: 13, quantityValue: 3, quantityUnit: 'el' },
    ]);
  });
});

describe('recipe-storage › Range before a unit and before an ingredient', () => {
  test('a range is one amount with both numbers', () => {
    assert.deepEqual(find('Voeg 2 à 3 el olie en 1 tot 2 eieren toe'), [
      { startIndex: 5, endIndex: 6, quantityValue: 2, quantityValueMax: 3, maxStartIndex: 9, maxEndIndex: 10, quantityUnit: 'el' },
      { startIndex: 22, endIndex: 23, quantityValue: 1, quantityValueMax: 2, maxStartIndex: 28, maxEndIndex: 29, quantityUnit: null },
    ]);
  });

  test('a dash range and a tussen range are found', () => {
    assert.deepEqual(
      find('Voeg 2-3 el olie toe').map((q) => [q.quantityValue, q.quantityValueMax]),
      [[2, 3]],
    );
    assert.deepEqual(
      find('Voeg tussen 2 en 3 eieren toe').map((q) => [q.quantityValue, q.quantityValueMax]),
      [[2, 3]],
    );
  });
});

describe('recipe-storage › Duration range is not stored', () => {
  test('no amount for minutes', () => {
    assert.deepEqual(find('Bak 20-25 minuten'), []);
  });
});

describe('findQuantities range separators', () => {
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
  ])('%s olie gives 2, 3 and el', (text) => {
    assert.deepEqual(
      find(`Voeg ${text} olie toe`).map((q) => [q.quantityValue, q.quantityValueMax, q.quantityUnit]),
      [[2, 3, 'el']],
    );
  });

  test('comma, slash and tilde make no range', () => {
    for (const text of ['2, 3 el', '2/3 el', '2~3 el']) assert.ok(find(`Voeg ${text} olie toe`).every((q) => q.quantityValueMax === undefined));
  });

  test('a reversed range keeps its order', () => {
    assert.deepEqual(
      find('Voeg 3-2 el olie toe').map((q) => [q.quantityValue, q.quantityValueMax]),
      [[3, 2]],
    );
  });

  test('a long range before an ingredient is found whole', () => {
    assert.deepEqual(
      find('Voeg 1 ½ tot en met 2 ½ eieren toe').map((q) => [q.quantityValue, q.quantityValueMax]),
      [[1.5, 2.5]],
    );
  });
});
