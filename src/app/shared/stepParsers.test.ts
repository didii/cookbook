import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { parseIngredient } from './ingredients';
import { defaultRules } from './rules';
import { findIngredients, findOven, findTimer, type Row } from './stepParsers';

const minutes = (text: string) => findTimer(text, defaultRules)?.values.minutes;
const degrees = (text: string) => findOven(text, defaultRules)?.values.degrees;
const words = (text: string, found?: { start: number; end: number }) => found && text.slice(found.start, found.end);

describe('recipe-step-chips › Minutes become a timer', () => {
  for (const unit of ['minuten', 'min', 'minuut']) {
    const text = `Laat 30 ${unit} rusten.`;

    test(`${unit} gives 30 minutes`, () => {
      assert.equal(minutes(text), 30);
    });

    test(`${unit} marks the words of the duration`, () => {
      assert.equal(words(text, findTimer(text, defaultRules)), `30 ${unit}`);
    });
  }

  test('the unit is case-insensitive', () => {
    assert.equal(minutes('Laat 30 MINUTEN rusten'), 30);
  });
});

describe('recipe-step-chips › Hours and fractions of hours', () => {
  test('whole hours', () => {
    assert.equal(minutes('Kook 2 uur'), 120);
  });

  test('a decimal comma', () => {
    assert.equal(minutes('Kook 1,5 uur'), 90);
  });

  test('a decimal point', () => {
    assert.equal(minutes('Kook 1.5 uur'), 90);
  });

  test('the short unit u', () => {
    assert.equal(minutes('Kook 1 u'), 60);
  });
});

describe('recipe-step-chips › Spoken amounts', () => {
  test('een half uur', () => {
    assert.equal(minutes('Laat een half uur staan'), 30);
  });

  test('een kwartier', () => {
    assert.equal(minutes('Laat een kwartier staan'), 15);
  });

  test('anderhalf uur', () => {
    assert.equal(minutes('Laat anderhalf uur staan'), 90);
  });

  test('in mixed case', () => {
    assert.equal(minutes('Laat Een Uur staan'), 60);
  });
});

describe('recipe-step-chips › A range uses its lower value', () => {
  const text = 'Bak 20-25 minuten';

  test('the lower value is the duration', () => {
    assert.equal(minutes(text), 20);
  });

  test('the whole range is marked', () => {
    assert.equal(words(text, findTimer(text, defaultRules)), '20-25 minuten');
  });

  test('a range with an en dash and spaces', () => {
    assert.equal(minutes('Bak 20 – 25 min'), 20);
  });
});

describe('recipe-step-chips › Text without a duration has no timer', () => {
  test('a weight', () => {
    assert.equal(findTimer('Voeg 30 gram boter toe', defaultRules), undefined);
  });

  test('a lone m', () => {
    assert.equal(findTimer('Voeg 30 m toe', defaultRules), undefined);
  });

  test('no number', () => {
    assert.equal(findTimer('Roer goed', defaultRules), undefined);
  });

  // Half typed: the chip appears when the word is complete.
  test('a half typed unit, mi', () => {
    assert.equal(findTimer('Laat 30 mi', defaultRules), undefined);
  });

  test('a half typed unit, minu', () => {
    assert.equal(findTimer('Laat 30 minu', defaultRules), undefined);
  });

  test('zero minutes', () => {
    assert.equal(findTimer('Laat 0 minuten rusten', defaultRules), undefined);
  });

  test('a longer word that starts with a unit', () => {
    assert.equal(findTimer('Laat 130 uurwerken', defaultRules), undefined);
  });
});

describe('recipe-step-chips › Only the first duration is a timer', () => {
  const text = 'Kook 10 minuten en daarna 20 minuten';

  test('the first duration is the timer', () => {
    assert.equal(minutes(text), 10);
  });

  test('only the first duration is marked', () => {
    assert.equal(words(text, findTimer(text, defaultRules)), '10 minuten');
  });
});

describe('recipe-step-chips › Degrees become an oven temperature', () => {
  for (const written of ['180 graden', '180 °C', '180°C', '180 °', '180 Graden']) {
    const text = `Verwarm op ${written} voor.`;

    test(`${written} gives 180 degrees`, () => {
      assert.equal(degrees(text), 180, written);
    });

    test(`${written} is marked as written`, () => {
      assert.equal(words(text, findOven(text, defaultRules)), written);
    });
  }
});

describe('recipe-step-chips › Implausible numbers are ignored', () => {
  test('3 degrees is too low', () => {
    assert.equal(degrees('Op 3 graden'), undefined);
  });

  test('1500 degrees is too high', () => {
    assert.equal(degrees('Op 1500 graden'), undefined);
  });

  test('49 degrees is just below the range', () => {
    assert.equal(degrees('Op 49 graden'), undefined);
  });

  test('301 degrees is just above the range', () => {
    assert.equal(degrees('Op 301 graden'), undefined);
  });

  test('50 degrees is the lowest accepted', () => {
    assert.equal(degrees('Op 50 graden'), 50);
  });

  test('300 degrees is the highest accepted', () => {
    assert.equal(degrees('Op 300 graden'), 300);
  });
});

describe('recipe-step-chips › Only the first temperature counts', () => {
  const text = 'Eerst 180 graden, daarna 200 graden';

  test('the first temperature is used', () => {
    assert.equal(degrees(text), 180);
  });

  test('only the first temperature is marked', () => {
    assert.equal(words(text, findOven(text, defaultRules)), '180 graden');
  });

  // An implausible first number does not hide a later plausible one.
  test('an implausible first number does not hide a later one', () => {
    assert.equal(degrees('3 graden warmer, 200 graden'), 200);
  });
});

const row = (id: string, line: string): Row => {
  const { quantityText, name } = parseIngredient(line, defaultRules);
  return { id, quantityText, name };
};
const none = () => '';
const found = (text: string, rows: Row[], fallback: (r: Row) => string = none) =>
  findIngredients(text, rows, fallback, defaultRules).map((f) => ({ row: f.rowId, words: text.slice(f.start, f.end), ...f.values }));

describe('recipe-step-chips › Name in the text creates an ingredient chip', () => {
  const rows = [row('a', '250 g zelfrijzende bloem')];

  test('a name found in the text gives a chip with the full name', () => {
    assert.deepEqual(found('Meng de bloem met water.', rows), [{ row: 'a', words: 'bloem', quantity: '', name: 'zelfrijzende bloem' }]);
  });

  test('matching ignores case', () => {
    assert.deepEqual(
      found('Meng de BLOEM met water.', rows).map((f) => f.words),
      ['BLOEM'],
    );
  });
});

describe('recipe-step-chips › Plurals match', () => {
  test('eieren and uien match their singular rows', () => {
    const rows = [row('ei', '2 ei'), row('ui', '1 ui')];
    assert.deepEqual(
      found('Klop de eieren en snijd de uien.', rows).map((f) => [f.row, f.words]),
      [
        ['ei', 'eieren'],
        ['ui', 'uien'],
      ],
    );
  });
});

describe('recipe-step-chips › The longest name wins', () => {
  const rows = [row('b', '100 g boter'), row('k', '150 g koude boter')];

  test('the longer name is chosen', () => {
    assert.deepEqual(
      found('Snijd de koude boter in blokjes.', rows).map((f) => [f.row, f.words]),
      [['k', 'koude boter']],
    );
  });

  // Without the longer name written out, the shorter row matches again.
  test('the shorter row matches again without the longer name', () => {
    assert.deepEqual(
      found('Snijd de boter in blokjes.', rows).map((f) => [f.row, f.words]),
      [['b', 'boter']],
    );
  });
});

describe('recipe-step-chips › Other words create nothing', () => {
  test('words that are no ingredient', () => {
    assert.deepEqual(found('Roer goed en laat rusten.', [row('a', '250 g bloem'), row('b', 'boter')]), []);
  });

  test('a text without the ingredient', () => {
    assert.deepEqual(found('Alles roeren', [row('a', '250 g bloem')]), []);
  });

  test('a row without a name', () => {
    assert.deepEqual(found('bloem', [row('a', '250 g')]), []);
  });
});

describe('recipe-step-chips › An ingredient is chipped once per step', () => {
  const text = 'Voeg bloem toe en daarna nog meer bloem.';

  test('only one chip for a repeated name', () => {
    assert.deepEqual(
      found(text, [row('a', 'bloem')]).map((f) => f.words),
      ['bloem'],
    );
  });

  test('the chip is on the first occurrence', () => {
    assert.equal(findIngredients(text, [row('a', 'bloem')], none, defaultRules)[0].start, text.indexOf('bloem'));
  });
});

describe('recipe-step-chips › Amount written before the name', () => {
  test('the written amount is used instead of the list amount', () => {
    assert.deepEqual(
      found('Smelt 100 g boter in een pan.', [row('b', '150 g boter')], () => '150 g'),
      [{ row: 'b', words: '100 g boter', quantity: '100 g', name: 'boter' }],
    );
  });

  test('an amount without a unit', () => {
    assert.deepEqual(
      found('Klop 2 eieren.', [row('e', 'ei')]).map((f) => [f.words, f.quantity]),
      [['2 eieren', '2']],
    );
  });

  test('an amount written against its unit', () => {
    assert.deepEqual(
      found('Wel 100g boter.', [row('b', 'boter')]).map((f) => f.words),
      ['100g boter'],
    );
  });

  // A duration is not an amount.
  test('a duration is not an amount', () => {
    assert.deepEqual(
      found('Na 10 minuten boter toevoegen.', [row('b', 'boter')]).map((f) => f.words),
      ['boter'],
    );
  });
});

describe('recipe-step-chips › Amount from the list when only this step uses the ingredient', () => {
  test('the chip gets the quantity of the list row', () => {
    const rows = [row('a', '250 g zelfrijzende bloem')];
    assert.equal(found('Zeef de bloem.', rows, (r) => r.quantityText)[0].quantity, '250 g');
  });
});

describe('findIngredients plural forms', () => {
  const matches = (text: string, line: string) => found(text, [row('x', line)]).map((f) => f.words);
  const cases: [string, string, string[]][] = [
    ['Was de bessen.', 'bes', ['bessen']],
    ['Was de bes.', 'bessen', ['bes']],
    ['Snijd de tomaten.', 'tomaat', ['tomaten']],
    ['Schil de appels.', 'appel', ['appels']],
    ['Hak de ui fijn.', 'uien', ['ui']],
    ["Bak de paddestoelen en de auto's.", 'auto', ["auto's"]],
    ['Schil de Peren.', 'peer', ['Peren']],
    ['Voeg crème toe.', 'creme', ['crème']],
    ['Voeg bloemen toe.', 'bloem', ['bloemen']],
    ['Voeg bakstenen toe.', 'bloem', []],
  ];
  for (const [text, line, expected] of cases) {
    test(`"${line}" in "${text}" matches ${expected.length ? expected.join(', ') : 'nothing'}`, () => {
      assert.deepEqual(matches(text, line), expected);
    });
  }
});

describe('parsing-rules › Degree words include the degree sign', () => {
  for (const text of ['180°', '180 °C', '180 graden'])
    test(`${text} is 180 degrees`, () => {
      assert.equal(findOven(text, defaultRules)?.values.degrees, 180);
    });
});

describe('parsing-rules › Grams are not degrees', () => {
  test('180 gr is no oven temperature', () => {
    assert.equal(findOven('180 gr', defaultRules), undefined);
  });

  test('180 gr bloem has the unit gr', () => {
    assert.equal(parseIngredient('180 gr bloem', defaultRules).unit, 'gr');
  });
});

// Recognition follows the rules.
const withRules = (change: Partial<typeof defaultRules>) => ({ ...defaultRules, ...change });

describe('parsing-rules › Words are not regular expressions', () => {
  const rules = withRules({ minuteWords: ['m+'] });

  test('the word m+ matches literally', () => {
    assert.equal(findTimer('20 m+', rules)?.values.minutes, 20);
  });

  test('the word m+ does not match mmm', () => {
    assert.equal(findTimer('20 mmm', rules), undefined);
  });
});

describe('parsing-rules › New minute word makes a timer', () => {
  const rules = withRules({ minuteWords: [...defaultRules.minuteWords, 'mins'] });

  test('the new rules find the timer', () => {
    assert.equal(findTimer('Bak 20 mins', rules)?.values.minutes, 20);
  });

  test('the default rules do not', () => {
    assert.equal(findTimer('Bak 20 mins', defaultRules), undefined);
  });
});

describe('parsing-rules › New spoken duration makes a timer', () => {
  test('the new spoken duration is found', () => {
    const rules = withRules({ spoken: { ...defaultRules.spoken, 'drie kwartier': 45 } });
    assert.equal(findTimer('Bak drie kwartier', rules)?.values.minutes, 45);
  });
});

describe('parsing-rules › Removed word is not recognised', () => {
  const rules = withRules({ degreeWords: ['°c', '°'] });

  test('the removed word is not found', () => {
    assert.equal(findOven('180 graden', rules), undefined);
  });

  test('the remaining words still are', () => {
    assert.equal(findOven('180 °C', rules)?.values.degrees, 180);
  });
});
