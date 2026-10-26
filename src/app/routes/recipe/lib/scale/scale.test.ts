import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { formatNumber, nextMultiplier, parseNumber, scaleIngredient, scaleText } from './scale';

const ingredient = (quantityText: string, quantityValue: number | null, quantityUnit: string | null) => ({
  quantityText,
  quantityValue,
  quantityUnit,
  name: 'x',
});

describe('recipe-scaling › Ingredient list scales', () => {
  test('the stored value is multiplied and shown with its unit', () => {
    assert.equal(scaleIngredient(ingredient('', 200, 'g'), 1.5), '300 g');
  });

  test('a value without a unit', () => {
    assert.equal(scaleIngredient(ingredient('', 2, null), 2), '4');
  });
});

describe('ingredient without a stored value', () => {
  test('its text is kept at every factor', () => {
    assert.deepEqual(
      [2, 0.5].map((f) => scaleIngredient(ingredient('2-3 el', null, 'el'), f)),
      ['2-3 el', '2-3 el'],
    );
  });
});

describe('recipe-scaling › Scaled ingredient keeps its unit', () => {
  test('the stored unit follows the scaled value', () => {
    assert.equal(scaleIngredient(ingredient('', 0.5, 'tl'), 3), '1,5 tl');
  });
});

describe('scaleIngredient', () => {
  test('factor 1 gives the quantity text as written', () => {
    assert.equal(scaleIngredient(ingredient('1 ½ el', 1.5, 'el'), 1), '1 ½ el');
  });

  test('an empty quantity stays empty', () => {
    assert.equal(scaleIngredient(ingredient('', null, null), 3), '');
  });

  test('the quantity text is ignored when scaling', () => {
    assert.equal(scaleIngredient(ingredient('quantityText', 5, 'unit'), 2), '10 unit');
  });

  test('only the quantity text is used at factor 1', () => {
    assert.equal(scaleIngredient(ingredient('quantityText', 5, 'unit'), 1), 'quantityText');
  });

  test('the scaled value is rounded like other scaled numbers', () => {
    assert.equal(scaleIngredient(ingredient('', 1, 'kg'), 1 / 3), '0,333 kg');
  });
});

describe('recipe-scaling › Quantity without a number', () => {
  test('an empty quantity stays empty', () => {
    assert.equal(scaleIngredient(ingredient('', null, null), 3), '');
  });

  test('a word stays as it is', () => {
    assert.equal(scaleIngredient(ingredient('snufje', null, null), 3), 'snufje');
  });
});

describe('recipe-scaling › Original at factor one', () => {
  test('a quantity keeps its own notation', () => {
    assert.equal(scaleIngredient(ingredient('1 ½ el', 1.5, 'el'), 1), '1 ½ el');
  });

  test('step text keeps its own notation', () => {
    assert.equal(scaleText('Meng 1 ½ el suiker', [{ startIndex: 5, endIndex: 8, quantityValue: 1.5, quantityUnit: 'el' }], 1), 'Meng 1 ½ el suiker');
  });
});

describe('recipe-scaling › Long numbers are rounded', () => {
  test('to three significant digits, whole above a hundred', () => {
    assert.deepEqual([133.3333, 13.3333, 1.33333, 0.333333, 1234.5].map(formatNumber), ['133', '13,3', '1,33', '0,333', '1235']);
  });
});

describe('recipe-scaling › Round numbers stay round', () => {
  test('no trailing digits are added', () => {
    assert.deepEqual([2.5, 2.5000001, 300].map(formatNumber), ['2,5', '2,5', '300']);
  });
});

describe('parseNumber', () => {
  test('reads a decimal comma', () => {
    assert.equal(parseNumber('2,5'), 2.5);
  });

  test('reads a fraction, ignoring spaces around it', () => {
    assert.equal(parseNumber(' 1/3 '), 1 / 3);
  });

  test('rejects text', () => {
    assert.equal(parseNumber('abc'), undefined);
  });

  test('rejects text after a number', () => {
    assert.equal(parseNumber('2 abc'), undefined);
  });
});

describe('nextMultiplier', () => {
  const up = (from: number, n: number) => Array.from({ length: n }, () => (from = nextMultiplier(from, 1)));
  const down = (from: number, n: number) => Array.from({ length: n }, () => (from = nextMultiplier(from, -1)));

  test('steps up from one', () => {
    assert.deepEqual(up(1, 6), [1.5, 2, 3, 4, 5, 6]);
  });

  test('steps down from one, stopping at a tenth', () => {
    assert.deepEqual(down(1, 7), [1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8, 1 / 10, 1 / 10]);
  });

  test('between two steps it goes to the nearest one in the direction', () => {
    assert.equal(nextMultiplier(2.5, 1), 3);
    assert.equal(nextMultiplier(2.5, -1), 2);
    assert.equal(nextMultiplier(0.3333, 1), 0.5);
    assert.equal(nextMultiplier(0.3333, -1), 1 / 4);
    assert.equal(nextMultiplier(4.5, -1), 4);
    assert.equal(nextMultiplier(4.5, 1), 5);
  });

  test('below the lowest step it goes to the lowest or the next one', () => {
    assert.equal(nextMultiplier(0.05, -1), 0.05);
    assert.equal(nextMultiplier(0.05, 1), 0.1);
  });

  test('a whole step down from five is four', () => {
    assert.equal(nextMultiplier(5, -1), 4);
  });
});

describe('recipe-scaling › Amounts in step text scale', () => {
  test('each stored amount is replaced by its value times the factor', () => {
    const quantities = [
      { startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' },
      { startIndex: 21, endIndex: 22, quantityValue: 2, quantityUnit: null },
    ];
    assert.equal(scaleText('Meng 200 g bloem met 2 eieren', quantities, 2), 'Meng 400 g bloem met 4 eieren');
  });
});

describe('step text without stored amounts', () => {
  test('the text is kept', () => {
    assert.equal(scaleText('Voeg 2-3 el olie toe', [], 2), 'Voeg 2-3 el olie toe');
  });
});

describe('recipe-scaling › Text without stored amounts stays as written', () => {
  test('a number that is no stored amount is unchanged', () => {
    const stored = [{ startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' }];
    assert.equal(scaleText('Meng 200 g bloem, bak 20 minuten', stored, 2), 'Meng 400 g bloem, bak 20 minuten');
  });
});

describe('scaleText', () => {
  const quantities = [{ startIndex: 5, endIndex: 8, quantityValue: 1.5, quantityUnit: null }];

  test('a stored place that holds no number is left alone', () => {
    assert.equal(scaleText('Meng wat suiker', quantities, 2), 'Meng wat suiker');
  });

  test('unsorted amounts are all replaced', () => {
    const unsorted = [
      { startIndex: 21, endIndex: 22, quantityValue: 2, quantityUnit: null },
      { startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' },
    ];
    assert.equal(scaleText('Meng 200 g bloem met 2 eieren', unsorted, 2), 'Meng 400 g bloem met 4 eieren');
  });

  test('an amount that overlaps one already replaced is skipped', () => {
    const overlapping = [
      { startIndex: 5, endIndex: 9, quantityValue: 1234, quantityUnit: null },
      { startIndex: 7, endIndex: 10, quantityValue: 5, quantityUnit: null },
    ];
    assert.equal(scaleText('Meng 12345 x', overlapping, 2), 'Meng 1210 x');
  });

  test('a longer replacement does not shift the amounts after it', () => {
    const grown = [
      { startIndex: 0, endIndex: 1, quantityValue: 5, quantityUnit: null },
      { startIndex: 12, endIndex: 13, quantityValue: 3, quantityUnit: null },
    ];
    assert.equal(scaleText('5 tsp zout, 3 el', grown, 2), '10 tsp zout, 6 el');
  });

  test('the scaled value is rounded like other scaled numbers', () => {
    assert.equal(scaleText('Meng 1 el', [{ startIndex: 5, endIndex: 6, quantityValue: 1, quantityUnit: null }], 1 / 3), 'Meng 0,333 el');
  });
});

const range = (quantityText: string, quantityValue: number, quantityValueMax: number) => ({
  quantityText,
  quantityValue,
  quantityValueMax,
  quantityUnit: 'el',
  name: 'olie',
});

describe('recipe-scaling › Ingredient range scales', () => {
  test('both numbers are multiplied', () => {
    assert.equal(scaleIngredient(range('2-3 el', 2, 3), 3), '6-9 el');
  });
});

describe('recipe-scaling › Ingredient range is shown with a dash', () => {
  test('a written separator becomes a dash', () => {
    assert.equal(scaleIngredient(range('2 à 3 el', 2, 3), 2), '4-6 el');
  });
});

describe('recipe-scaling › Chip range scales', () => {
  test('the chip shows min-max and its unit', () => {
    assert.equal(scaleIngredient(range('1 tot 2 el', 1, 2), 2), '2-4 el');
  });
});

describe('recipe-scaling › Reversed range scales both numbers', () => {
  test('the order is kept', () => {
    assert.equal(scaleIngredient(range('3-2 el', 3, 2), 2), '6-4 el');
  });
});

describe('recipe-scaling › Range numbers are short', () => {
  test('both have at most 3 significant digits', () => {
    assert.equal(scaleIngredient(range('1-2 el', 1, 2), 1 / 3), '0,333-0,667 el');
  });
});

describe('recipe-scaling › Range at factor one', () => {
  test('the stored text is shown', () => {
    assert.equal(scaleIngredient(range('2 à 3 el', 2, 3), 1), '2 à 3 el');
  });
});

describe('recipe-scaling › Range in step text keeps its words', () => {
  const text = 'Voeg 2 à 3 el olie toe';
  const amount = { startIndex: 5, endIndex: 6, quantityValue: 2, quantityValueMax: 3, maxStartIndex: 9, maxEndIndex: 10, quantityUnit: 'el' };

  test('only the numbers are replaced', () => {
    assert.equal(scaleText(text, [amount], 2), 'Voeg 4 à 6 el olie toe');
  });

  test('a half-edited range is left alone as a whole', () => {
    assert.equal(scaleText('Voeg 2 à drie el olie toe', [amount], 2), 'Voeg 2 à drie el olie toe');
  });

  test('a range next to another amount scales both', () => {
    const other = { startIndex: 22, endIndex: 23, quantityValue: 1, quantityUnit: null };
    assert.equal(scaleText('Voeg 2 à 3 el olie en 1 ei toe', [other, amount], 2), 'Voeg 4 à 6 el olie en 2 ei toe');
  });
});
