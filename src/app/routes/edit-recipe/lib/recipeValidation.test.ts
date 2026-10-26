import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
import { defaultRules } from '~app/shared/rules';
import { readIngredients, readSteps, readTags, tagError, validate } from './recipeValidation';

const ok = { title: 'Soep', author: 'Oma', servings: '4', time: '', intro: '', image: '' };

describe('recipe-creation › Missing title', () => {
  test('only the title is reported', () => {
    assert.deepEqual(Object.keys(validate({ ...ok, title: '' })), ['title']);
  });
});

describe('recipe-creation › Invalid servings', () => {
  for (const servings of ['0', '-2', '2.5', 'veel'])
    test(`${servings} reports only the servings`, () => {
      assert.deepEqual(Object.keys(validate({ ...ok, servings })), ['servings']);
    });
});

describe('validate', () => {
  test('accepts empty servings', () => {
    assert.deepEqual(validate({ ...ok, servings: '' }), {});
  });

  test('reports a missing author', () => {
    assert.deepEqual(Object.keys(validate({ ...ok, author: '' })), ['author']);
  });
});

const formWith = (json: string) => {
  const form = new FormData();
  form.set('ingredients', json);
  return form;
};
const post = (rows: unknown) => readIngredients(formWith(JSON.stringify(rows)), defaultRules);

describe('recipe-ingredient-editing › Blank rows are not stored', () => {
  const result = () => post([{ text: '' }, { text: '250 g bloem' }, { text: '  ' }, { text: 'zout' }, { text: '' }]);

  test('only the filled rows are kept', () => {
    assert.deepEqual(
      result().ingredients?.map((i) => i.name),
      ['bloem', 'zout'],
    );
  });

  test('there are no errors', () => {
    assert.deepEqual(result().errors, {});
  });
});

describe('recipe-ingredient-editing › Quantity without a name is refused', () => {
  test('the row is reported', () => {
    const { errors } = post([{ text: 'zout' }, { text: '250 g' }]);
    assert.deepEqual(Object.keys(errors), ['1']);
  });

  test('a loose unit alone is reported on its row', () => {
    const { errors } = post([{ text: 'zout' }, { text: 'scheutje' }]);
    assert.deepEqual(Object.keys(errors), ['1']);
  });
});

describe('readIngredients', () => {
  test('the server parses the text itself and ignores what the client sent', () => {
    assert.deepEqual(post([{ text: '2 el. olie', quantityText: 'x' }]).ingredients, [
      { quantityText: '2 el.', quantityValue: 2, quantityUnit: 'el', name: 'olie' },
    ]);
  });

  describe('a missing or malformed list gives no lines', () => {
    test('not an array', () => {
      assert.deepEqual(post('nope').lines, []);
    });

    test('no field', () => {
      assert.deepEqual(readIngredients(new FormData(), defaultRules).lines, []);
    });

    test('invalid JSON', () => {
      assert.deepEqual(readIngredients(formWith('{'), defaultRules).lines, []);
    });
  });

  describe('a missing or malformed field is "not given", an empty list is "none"', () => {
    test('no field is not given', () => {
      assert.equal(readIngredients(new FormData(), defaultRules).ingredients, undefined);
    });

    test('invalid JSON is not given', () => {
      assert.equal(readIngredients(formWith('{'), defaultRules).ingredients, undefined);
    });

    test('not an array is not given', () => {
      assert.equal(post('nope').ingredients, undefined);
    });

    test('an empty list is none', () => {
      assert.deepEqual(post([]).ingredients, []);
    });
  });
});

const stepsForm = (json: string) => {
  const form = new FormData();
  form.set('steps', json);
  return form;
};
const read = (form: FormData, ingredients: { quantityText: string; name: string }[] = []) => readSteps(form, ingredients, defaultRules);
const postSteps = (bodies: unknown, ingredients: { quantityText: string; name: string }[] = []) =>
  read(stepsForm(JSON.stringify(bodies)), ingredients);

const plain = (body: string): Step => ({ body, ingredients: [] });
/** A step as stored: with the amounts found in its text. */
const kept = (body: string): Step => ({ ...plain(body), quantities: [] });

describe('recipe-step-editing › Blank steps are not stored', () => {
  test('only the filled steps are kept, trimmed', () => {
    const { steps } = postSteps([{ body: '' }, { body: 'kneed' }, { body: '  ' }, { body: ' bak ' }, { body: '\n' }]);
    assert.deepEqual(steps, [kept('kneed'), kept('bak')]);
  });
});

describe('readSteps', () => {
  describe('the server cleans the steps itself: line breaks become spaces', () => {
    const result = () => postSteps([{ body: 'kneed\r\nen rijs\n\n bak' }, { body: '' }]);

    test('the stored steps have no line breaks', () => {
      assert.deepEqual(result().steps, [kept('kneed en rijs bak')]);
    });

    test('the lines keep the blank step', () => {
      assert.deepEqual(result().lines, [plain('kneed en rijs bak'), plain('')]);
    });
  });

  describe('a missing or malformed field is "not given", an empty list is "none"', () => {
    test('no field is not given', () => {
      assert.equal(read(new FormData()).steps, undefined);
    });

    test('invalid JSON is not given', () => {
      assert.equal(read(stepsForm('{')).steps, undefined);
    });

    test('not an array is not given', () => {
      assert.equal(postSteps('nope').steps, undefined);
    });

    test('an empty list is none', () => {
      assert.deepEqual(postSteps([]).steps, []);
    });

    test('no field gives no lines', () => {
      assert.deepEqual(read(new FormData()).lines, []);
    });
  });

  test('the server reads the chips of a step and leaves out what is not valid', () => {
    const { steps } = postSteps([
      {
        body: 'bak',
        ingredients: [{ quantityText: ' 250 g ', name: ' bloem ' }, { quantityText: '1', name: '  ' }, { name: 'boter' }, 'x', null],
        ovenTemperature: 40,
        timer: { minutes: 25, label: ' Bakken ' },
      },
      { body: 'rust', ovenTemperature: 0, timer: { minutes: 0, label: 'Rust' } },
      { body: 'koel', ovenTemperature: 18.5, timer: { minutes: '5' }, ingredients: 'nope' },
      { body: 'klaar', timer: { label: 'Zonder minuten' } },
    ]);
    assert.deepEqual(steps, [
      {
        body: 'bak',
        ingredients: [
          { quantityText: '250 g', quantityValue: 250, quantityUnit: 'g', name: 'bloem' },
          { quantityText: '', quantityValue: null, quantityUnit: null, name: 'boter' },
        ],
        ovenTemperature: 40,
        timer: { minutes: 25, label: 'Bakken' },
        quantities: [],
      },
      kept('rust'),
      kept('koel'),
      kept('klaar'),
    ]);
  });
});

describe('recipe-storage › Chip quantity is read from its text on save', () => {
  test('the value and unit come from the quantity text, never from the post', () => {
    const { steps } = postSteps([
      {
        body: 'meng',
        ingredients: [
          { quantityText: '½ tl', quantityValue: 99, quantityUnit: 'kg', name: 'zout' },
          { quantityText: '1 klontje', name: 'boter' },
        ],
      },
    ]);
    assert.deepEqual(
      steps?.[0].ingredients.map((c) => [c.quantityValue, c.quantityUnit]),
      [
        [0.5, 'tl'],
        [1, 'klontje'],
      ],
    );
  });
});

describe('chip quantity without a number', () => {
  test('the text is kept and the value and unit are null', () => {
    const { steps } = postSteps([{ body: 'bak', ingredients: [{ quantityText: 'een beetje', name: 'olie' }] }]);
    assert.deepEqual(steps?.[0].ingredients, [{ quantityText: 'een beetje', quantityValue: null, quantityUnit: null, name: 'olie' }]);
  });
});

describe('recipe-storage › Amount before a unit and before an ingredient', () => {
  test('the amounts are found with their value and unit', () => {
    const { steps } = postSteps(
      [{ body: 'Meng 200 g bloem met 2 eieren' }],
      [
        { quantityText: '500 g', name: 'bloem' },
        { quantityText: '4', name: 'ei' },
      ],
    );
    assert.deepEqual(steps?.[0].quantities, [
      { startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' },
      { startIndex: 21, endIndex: 22, quantityValue: 2, quantityUnit: null },
    ]);
  });

  test('amounts sent by the browser are ignored', () => {
    const { steps } = postSteps([{ body: 'Meng 200 g bloem', quantities: [{ startIndex: 0, endIndex: 4, quantityValue: 9, quantityUnit: null }] }]);
    assert.deepEqual(
      steps?.[0].quantities?.map((q) => q.quantityValue),
      [200],
    );
  });
});

describe('recipe-storage › Places refer to the stored text', () => {
  test('each place points at its number in the cleaned text', () => {
    const { steps } = postSteps([{ body: '  Meng\r\n  200 g bloem \n' }]);
    const [step] = steps ?? [];
    assert.deepEqual(
      step.quantities?.map((q) => step.body.slice(q.startIndex, q.endIndex)),
      ['200'],
    );
  });
});

describe('recipe-storage › Durations and temperatures are not stored', () => {
  test('no amount is found', () => {
    const { steps } = postSteps([{ body: 'Bak 20 minuten op 180 graden' }], [{ quantityText: '', name: 'olie' }]);
    assert.deepEqual(steps?.[0].quantities, []);
  });
});

describe('recipe-storage › Chip quantity that is a loose unit', () => {
  test('the chip is stored with value 1 and that unit', () => {
    const { steps } = postSteps([{ body: 'meng', ingredients: [{ quantityText: 'scheutje', name: 'rode wijn' }] }]);
    assert.deepEqual(
      steps?.[0].ingredients.map((c) => [c.quantityValue, c.quantityUnit]),
      [[1, 'scheutje']],
    );
  });
});

describe('recipe-storage › Chip quantity word that is not a loose unit', () => {
  test('the chip is stored with no value and no unit', () => {
    const { steps } = postSteps([{ body: 'meng', ingredients: [{ quantityText: 'el', name: 'olie' }] }]);
    assert.deepEqual(
      steps?.[0].ingredients.map((c) => [c.quantityValue, c.quantityUnit]),
      [[null, null]],
    );
  });
});

const tagsForm = (value?: string) => {
  const form = new FormData();
  if (value !== undefined) form.set('tags', value);
  return form;
};

describe('readTags', () => {
  test('a posted list is read, trimmed, without blanks', () => {
    assert.deepEqual(readTags(tagsForm(JSON.stringify([' Soep ', '', '  ', 'Winter']))), ['Soep', 'Winter']);
  });

  test('an empty list is none', () => {
    assert.deepEqual(readTags(tagsForm('[]')), []);
  });

  test('a missing field is not given', () => {
    assert.equal(readTags(tagsForm()), undefined);
  });

  test('invalid JSON is not given', () => {
    assert.equal(readTags(tagsForm('{')), undefined);
  });

  test('not an array is not given', () => {
    assert.equal(readTags(tagsForm('"soep"')), undefined);
  });
});

describe('tagError', () => {
  test('a tag of 100 characters is fine', () => {
    assert.equal(tagError(['a'.repeat(100)]), undefined);
  });

  test('a tag of 101 characters is refused', () => {
    assert.ok(tagError(['a'.repeat(101)]));
  });

  test('no tags given is fine', () => {
    assert.equal(tagError(undefined), undefined);
  });
});

describe('chip range on save', () => {
  test('the chip keeps its maximum value', () => {
    const { steps } = postSteps([{ body: 'bak', ingredients: [{ quantityText: '2-3 el', name: 'olie' }] }]);
    assert.deepEqual(steps?.[0].ingredients, [{ quantityText: '2-3 el', quantityValue: 2, quantityValueMax: 3, quantityUnit: 'el', name: 'olie' }]);
  });
});
