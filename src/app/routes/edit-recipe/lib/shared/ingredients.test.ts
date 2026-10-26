import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { joinIngredient, parseIngredient } from './ingredients';

describe('recipe-ingredient-editing › Quantity with unit and name', () => {
  test('splits quantity text, amount, unit and name', () => {
    assert.deepEqual(parseIngredient('250 g zelfrijzende bloem', defaultRules), {
      quantityText: '250 g',
      quantityValue: 250,
      quantityUnit: 'g',
      name: 'zelfrijzende bloem',
    });
  });
});

describe('recipe-ingredient-editing › Quantity without unit', () => {
  test('has an amount but no unit', () => {
    assert.deepEqual(parseIngredient('1 ei', defaultRules), { quantityText: '1', quantityValue: 1, quantityUnit: undefined, name: 'ei' });
  });
});

describe('recipe-ingredient-editing › Fraction and decimal comma', () => {
  test('a fraction glyph is an amount', () => {
    assert.deepEqual(parseIngredient('½ tl zout', defaultRules), { quantityText: '½ tl', quantityValue: 0.5, quantityUnit: 'tl', name: 'zout' });
  });

  test('a decimal comma is an amount', () => {
    assert.deepEqual(parseIngredient('1,5 l water', defaultRules), { quantityText: '1,5 l', quantityValue: 1.5, quantityUnit: 'l', name: 'water' });
  });

  test('a slash fraction is an amount', () => {
    assert.equal(parseIngredient('1/2 tl zout', defaultRules).quantityValue, 0.5);
  });

  test('a decimal dot is an amount', () => {
    assert.equal(parseIngredient('1.5 l water', defaultRules).quantityValue, 1.5);
  });
});

describe('recipe-ingredient-editing › Unknown word after the number is part of the name', () => {
  test('keeps the word in the name and has no unit', () => {
    assert.deepEqual(parseIngredient('2 grote uien', defaultRules), {
      quantityText: '2',
      quantityValue: 2,
      quantityUnit: undefined,
      name: 'grote uien',
    });
  });
});

describe('recipe-ingredient-editing › No quantity', () => {
  test('has only a name', () => {
    assert.deepEqual(parseIngredient('bruine suiker', defaultRules), { quantityText: '', name: 'bruine suiker' });
  });
});

describe('parseIngredient', () => {
  test('a range has both values', () => {
    assert.deepEqual(parseIngredient('2-3 el olie', defaultRules), {
      quantityText: '2-3 el',
      quantityValue: 2,
      quantityValueMax: 3,
      quantityUnit: 'el',
      name: 'olie',
    });
  });

  test('tussen … en … is a range and part of the quantity text', () => {
    assert.deepEqual(parseIngredient('tussen 2 en 3 eieren', defaultRules), {
      quantityText: 'tussen 2 en 3',
      quantityValue: 2,
      quantityValueMax: 3,
      quantityUnit: undefined,
      name: 'eieren',
    });
  });

  test('2 en 3 alone is no range', () => {
    assert.equal(parseIngredient('2 en 3 eieren', defaultRules).quantityValueMax, undefined);
  });

  describe('a whole number with a fraction', () => {
    test('adds up to the amount', () => {
      assert.equal(parseIngredient('1 ½ kg bloem', defaultRules).quantityValue, 1.5);
      assert.equal(parseIngredient('1 1/4 kg bloem', defaultRules).quantityValue, 1.25);
    });

    test('is one quantity text', () => {
      assert.equal(parseIngredient('1 ½ kg bloem', defaultRules).quantityText, '1 ½ kg');
    });
  });

  test('a trailing dot, case and leading spaces are accepted', () => {
    assert.deepEqual(parseIngredient('  2 El. olie', defaultRules), { quantityText: '2 El.', quantityValue: 2, quantityUnit: 'el', name: 'olie' });
  });

  test('a unit may follow the number without a space', () => {
    assert.equal(parseIngredient('250g bloem', defaultRules).quantityUnit, 'g');
  });

  describe('a line that is only a number', () => {
    test('with a unit has an empty name', () => {
      assert.deepEqual(parseIngredient('250 g', defaultRules), { quantityText: '250 g', quantityValue: 250, quantityUnit: 'g', name: '' });
    });

    test('without a unit has an empty name', () => {
      assert.equal(parseIngredient('3', defaultRules).name, '');
    });
  });
});

describe('joinIngredient', () => {
  test('puts the quantity before the name', () => {
    assert.equal(joinIngredient({ quantityText: '250 g', name: 'bloem' }), '250 g bloem');
  });

  test('leaves out an empty quantity', () => {
    assert.equal(joinIngredient({ quantityText: '', name: 'zout' }), 'zout');
  });
});

// Recognition follows the rules.
const withRules = (change: Partial<typeof defaultRules>) => ({ ...defaultRules, ...change });

describe('parsing-rules › New unit is recognised', () => {
  test('the unit and name are split', () => {
    const parsed = parseIngredient('2 kopje rijst', withRules({ units: [...defaultRules.units, 'kopje'] }));
    assert.deepEqual([parsed.quantityUnit, parsed.name], ['kopje', 'rijst']);
  });
});

describe('recipe-ingredient-editing › Loose unit without a number', () => {
  test('is the quantity with value 1 and the unit', () => {
    assert.deepEqual(parseIngredient('scheutje rode wijn', defaultRules), {
      quantityText: 'scheutje',
      quantityValue: 1,
      quantityUnit: 'scheutje',
      name: 'rode wijn',
    });
  });
});

describe('recipe-ingredient-editing › Loose unit with a number', () => {
  test('keeps the number as the amount', () => {
    assert.deepEqual(parseIngredient('2 scheutje rode wijn', defaultRules), {
      quantityText: '2 scheutje',
      quantityValue: 2,
      quantityUnit: 'scheutje',
      name: 'rode wijn',
    });
  });
});

describe('recipe-ingredient-editing › Measure without a number is part of the name', () => {
  test('a unit that is not loose stays in the name', () => {
    assert.deepEqual(parseIngredient('el suiker', defaultRules), { quantityText: '', name: 'el suiker' });
  });
});

describe('recipe-ingredient-editing › Loose unit alone has no name', () => {
  test('the quantity is the loose unit and the name is empty', () => {
    assert.deepEqual(parseIngredient('scheutje', defaultRules), { quantityText: 'scheutje', quantityValue: 1, quantityUnit: 'scheutje', name: '' });
  });
});

describe('recipe-ingredient-editing › Loose unit is a whole word', () => {
  test('a longer word is all name', () => {
    assert.deepEqual(parseIngredient('scheutjeswijn', defaultRules), { quantityText: '', name: 'scheutjeswijn' });
  });
});

describe('parseIngredient', () => {
  test('a loose unit is matched ignoring case, the quantity text stays as typed', () => {
    assert.deepEqual(parseIngredient('Scheutje rode wijn', defaultRules), {
      quantityText: 'Scheutje',
      quantityValue: 1,
      quantityUnit: 'scheutje',
      name: 'rode wijn',
    });
  });
});

describe('recipe-ingredient-editing › Removed loose unit is not recognised', () => {
  test('the line is all name', () => {
    const rules = { ...defaultRules, looseUnits: defaultRules.looseUnits.filter((u) => u !== 'scheutje') };
    assert.deepEqual(parseIngredient('scheutje rode wijn', rules), { quantityText: '', name: 'scheutje rode wijn' });
  });
});

describe('recipe-storage › Numbers are stored as typed', () => {
  test('numbers are stored as typed', () => {
    const read = (line: string) => {
      const { quantityValue, quantityValueMax } = parseIngredient(line, defaultRules);
      return [quantityValue, quantityValueMax];
    };
    assert.deepEqual(read('2-3 el olie'), [2, 3]);
    assert.deepEqual(read('3-2 el olie'), [3, 2]);
  });
});

describe('parseIngredient range separators', () => {
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
    const { quantityValue, quantityValueMax, quantityUnit } = parseIngredient(`${text} olie`, defaultRules);
    assert.deepEqual([quantityValue, quantityValueMax, quantityUnit], [2, 3, 'el']);
  });

  test('comma, slash and tilde make no range', () => {
    for (const text of ['2, 3 el olie', '2/3 el olie', '2~3 el olie']) assert.equal(parseIngredient(text, defaultRules).quantityValueMax, undefined);
  });

  test('fractions on either side', () => {
    assert.deepEqual(
      ['½-1 el olie', '1 1/2 - 2 el olie'].map((l) => [
        parseIngredient(l, defaultRules).quantityValue,
        parseIngredient(l, defaultRules).quantityValueMax,
      ]),
      [
        [0.5, 1],
        [1.5, 2],
      ],
    );
  });
});
