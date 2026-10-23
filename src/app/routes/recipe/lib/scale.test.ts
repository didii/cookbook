import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { formatNumber, nextMultiplier, parseNumber, scaleBody, scaleQuantity } from './scale';

const rows = [
  { id: '0', quantityText: '200 g', name: 'bloem' },
  { id: '1', quantityText: '2', name: 'eieren' },
];

describe('recipe-scaling › Ingredient list scales', () => {
  test('a quantity with a unit', () => {
    assert.equal(scaleQuantity('200 g', 1.5), '300 g');
  });

  test('a quantity without a unit', () => {
    assert.equal(scaleQuantity('2', 2), '4');
  });
});

describe('recipe-scaling › Amounts in step text scale', () => {
  test('amounts that match a list row', () => {
    assert.equal(scaleBody('Meng 200 g bloem met 2 eieren', 2, rows, defaultRules), 'Meng 400 g bloem met 4 eieren');
  });

  test('a unit alone is enough, also without a matching row', () => {
    assert.equal(scaleBody('Voeg 1,5 el suiker toe', 2, [], defaultRules), 'Voeg 3 el suiker toe');
  });
});

describe('recipe-scaling › Times and temperatures do not scale', () => {
  test('minutes and degrees in words', () => {
    assert.equal(scaleBody('Bak 20 minuten op 180 graden', 2, rows, defaultRules), 'Bak 20 minuten op 180 graden');
  });

  test('hours and °C', () => {
    assert.equal(scaleBody('Bak 1 uur op 200 °C', 2, rows, defaultRules), 'Bak 1 uur op 200 °C');
  });

  test('a bare degree sign', () => {
    assert.equal(scaleBody('Bak op 180°', 2, rows, defaultRules), 'Bak op 180°');
  });
});

describe('recipe-scaling › Ranges scale', () => {
  test('in a quantity', () => {
    assert.equal(scaleQuantity('2-3 el', 2), '4-6 el');
  });

  test('in step text', () => {
    assert.equal(scaleBody('Neem 2-3 el olie', 2, [], defaultRules), 'Neem 4-6 el olie');
  });
});

describe('recipe-scaling › Quantity without a number', () => {
  test('an empty quantity stays empty', () => {
    assert.equal(scaleQuantity('', 3), '');
  });

  test('a word stays as it is', () => {
    assert.equal(scaleQuantity('snufje', 3), 'snufje');
  });
});

describe('recipe-scaling › Original at factor one', () => {
  test('a quantity keeps its own notation', () => {
    assert.equal(scaleQuantity('1 ½ el', 1), '1 ½ el');
  });

  test('step text keeps its own notation', () => {
    assert.equal(scaleBody('Meng 1 ½ el suiker', 1, [], defaultRules), 'Meng 1 ½ el suiker');
  });

  test('another factor does rewrite it', () => {
    assert.equal(scaleQuantity('1 ½ el', 2), '3 el');
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

describe('scaleQuantity', () => {
  describe('fractions and glyphs', () => {
    test('a slash fraction', () => {
      assert.equal(scaleQuantity('1/2 tl', 3), '1,5 tl');
    });

    test('a fraction glyph', () => {
      assert.equal(scaleQuantity('½ tl', 1 / 3), '0,167 tl');
    });

    test('a whole number with a slash fraction', () => {
      assert.equal(scaleQuantity('1 2/3 kg', 3), '5 kg');
    });
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

const withRules = (change: Partial<typeof defaultRules>) => ({ ...defaultRules, ...change });

describe('parsing-rules › Scaling uses the stored units', () => {
  const rules = withRules({ units: [...defaultRules.units, 'kopje'] });
  const rows = [{ id: '0', quantityText: '2 kopje', name: 'rijst' }];

  test('a stored unit is scaled', () => {
    assert.equal(scaleBody('doe 2 kopje bloem erbij', 2, [], rules), 'doe 4 kopje bloem erbij');
  });

  test('without the stored unit it is not', () => {
    assert.equal(scaleBody('doe 2 kopje bloem erbij', 2, rows, defaultRules), 'doe 2 kopje bloem erbij');
  });
});
