import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultRules } from '~app/shared/rules';
import { joinIngredient, parseIngredient } from './ingredients';

describe('recipe-ingredient-editing › Quantity with unit and name', () => {
  test('splits quantity text, amount, unit and name', () => {
    assert.deepEqual(parseIngredient('250 g zelfrijzende bloem', defaultRules), {
      quantityText: '250 g',
      amount: 250,
      unit: 'g',
      name: 'zelfrijzende bloem',
    });
  });
});

describe('recipe-ingredient-editing › Quantity without unit', () => {
  test('has an amount but no unit', () => {
    assert.deepEqual(parseIngredient('1 ei', defaultRules), { quantityText: '1', amount: 1, unit: undefined, name: 'ei' });
  });
});

describe('recipe-ingredient-editing › Fraction and decimal comma', () => {
  test('a fraction glyph is an amount', () => {
    assert.deepEqual(parseIngredient('½ tl zout', defaultRules), { quantityText: '½ tl', amount: 0.5, unit: 'tl', name: 'zout' });
  });

  test('a decimal comma is an amount', () => {
    assert.deepEqual(parseIngredient('1,5 l water', defaultRules), { quantityText: '1,5 l', amount: 1.5, unit: 'l', name: 'water' });
  });

  test('a slash fraction is an amount', () => {
    assert.equal(parseIngredient('1/2 tl zout', defaultRules).amount, 0.5);
  });

  test('a decimal dot is an amount', () => {
    assert.equal(parseIngredient('1.5 l water', defaultRules).amount, 1.5);
  });
});

describe('recipe-ingredient-editing › Unknown word after the number is part of the name', () => {
  test('keeps the word in the name and has no unit', () => {
    assert.deepEqual(parseIngredient('2 grote uien', defaultRules), { quantityText: '2', amount: 2, unit: undefined, name: 'grote uien' });
  });
});

describe('recipe-ingredient-editing › No quantity', () => {
  test('has only a name', () => {
    assert.deepEqual(parseIngredient('bruine suiker', defaultRules), { quantityText: '', name: 'bruine suiker' });
  });
});

describe('parseIngredient', () => {
  test('a range has no amount', () => {
    assert.deepEqual(parseIngredient('2-3 el olie', defaultRules), { quantityText: '2-3 el', amount: undefined, unit: 'el', name: 'olie' });
  });

  describe('a whole number with a fraction', () => {
    test('adds up to the amount', () => {
      assert.equal(parseIngredient('1 ½ kg bloem', defaultRules).amount, 1.5);
      assert.equal(parseIngredient('1 1/4 kg bloem', defaultRules).amount, 1.25);
    });

    test('is one quantity text', () => {
      assert.equal(parseIngredient('1 ½ kg bloem', defaultRules).quantityText, '1 ½ kg');
    });
  });

  test('a trailing dot, case and leading spaces are accepted', () => {
    assert.deepEqual(parseIngredient('  2 El. olie', defaultRules), { quantityText: '2 El.', amount: 2, unit: 'el', name: 'olie' });
  });

  test('a unit may follow the number without a space', () => {
    assert.equal(parseIngredient('250g bloem', defaultRules).unit, 'g');
  });

  describe('a line that is only a number', () => {
    test('with a unit has an empty name', () => {
      assert.deepEqual(parseIngredient('250 g', defaultRules), { quantityText: '250 g', amount: 250, unit: 'g', name: '' });
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
