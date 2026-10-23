import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Step } from './recipe';
import { readIngredients, readSteps, validate } from './recipeValidation';
import { defaultRules } from './rules';

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
    assert.deepEqual(errors, { 1: 'Vul bij "250 g" ook een naam in.' });
  });
});

describe('readIngredients', () => {
  test('the server parses the text itself and ignores what the client sent', () => {
    assert.deepEqual(post([{ text: '2 el. olie', quantityText: 'x' }]).ingredients, [{ quantityText: '2 el.', amount: 2, unit: 'el', name: 'olie' }]);
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
const postSteps = (bodies: unknown) => readSteps(stepsForm(JSON.stringify(bodies)));

const plain = (body: string): Step => ({ body, ingredients: [] });

describe('recipe-step-editing › Blank steps are not stored', () => {
  test('only the filled steps are kept, trimmed', () => {
    const { steps } = postSteps([{ body: '' }, { body: 'kneed' }, { body: '  ' }, { body: ' bak ' }, { body: '\n' }]);
    assert.deepEqual(steps, [plain('kneed'), plain('bak')]);
  });
});

describe('readSteps', () => {
  describe('the server cleans the steps itself: line breaks become spaces', () => {
    const result = () => postSteps([{ body: 'kneed\r\nen rijs\n\n bak' }, { body: '' }]);

    test('the stored steps have no line breaks', () => {
      assert.deepEqual(result().steps, [plain('kneed en rijs bak')]);
    });

    test('the lines keep the blank step', () => {
      assert.deepEqual(result().lines, [plain('kneed en rijs bak'), plain('')]);
    });
  });

  describe('a missing or malformed field is "not given", an empty list is "none"', () => {
    test('no field is not given', () => {
      assert.equal(readSteps(new FormData()).steps, undefined);
    });

    test('invalid JSON is not given', () => {
      assert.equal(readSteps(stepsForm('{')).steps, undefined);
    });

    test('not an array is not given', () => {
      assert.equal(postSteps('nope').steps, undefined);
    });

    test('an empty list is none', () => {
      assert.deepEqual(postSteps([]).steps, []);
    });

    test('no field gives no lines', () => {
      assert.deepEqual(readSteps(new FormData()).lines, []);
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
          { quantityText: '250 g', name: 'bloem' },
          { quantityText: '', name: 'boter' },
        ],
        ovenTemperature: 40,
        timer: { minutes: 25, label: 'Bakken' },
      },
      plain('rust'),
      plain('koel'),
      plain('klaar'),
    ]);
  });
});
