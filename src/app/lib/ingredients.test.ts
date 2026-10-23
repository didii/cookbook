import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultRules } from '~app/lib/rules';
import { joinIngredient, parseIngredient } from './ingredients';

test('recipe-ingredient-editing › Quantity with unit and name', () => {
  assert.deepEqual(parseIngredient('250 g zelfrijzende bloem', defaultRules), {
    quantityText: '250 g',
    amount: 250,
    unit: 'g',
    name: 'zelfrijzende bloem',
  });
});

test('recipe-ingredient-editing › Quantity without unit', () => {
  assert.deepEqual(parseIngredient('1 ei', defaultRules), { quantityText: '1', amount: 1, unit: undefined, name: 'ei' });
});

test('recipe-ingredient-editing › Fraction and decimal comma', () => {
  assert.deepEqual(parseIngredient('½ tl zout', defaultRules), { quantityText: '½ tl', amount: 0.5, unit: 'tl', name: 'zout' });
  assert.deepEqual(parseIngredient('1,5 l water', defaultRules), { quantityText: '1,5 l', amount: 1.5, unit: 'l', name: 'water' });
  assert.equal(parseIngredient('1/2 tl zout', defaultRules).amount, 0.5);
  assert.equal(parseIngredient('1.5 l water', defaultRules).amount, 1.5);
});

test('recipe-ingredient-editing › Unknown word after the number is part of the name', () => {
  assert.deepEqual(parseIngredient('2 grote uien', defaultRules), { quantityText: '2', amount: 2, unit: undefined, name: 'grote uien' });
});

test('recipe-ingredient-editing › No quantity', () => {
  assert.deepEqual(parseIngredient('bruine suiker', defaultRules), { quantityText: '', name: 'bruine suiker' });
});

test('a range has no amount', () => {
  assert.deepEqual(parseIngredient('2-3 el olie', defaultRules), { quantityText: '2-3 el', amount: undefined, unit: 'el', name: 'olie' });
});

test('a whole number with a fraction adds up', () => {
  assert.equal(parseIngredient('1 ½ kg bloem', defaultRules).amount, 1.5);
  assert.equal(parseIngredient('1 1/4 kg bloem', defaultRules).amount, 1.25);
  assert.equal(parseIngredient('1 ½ kg bloem', defaultRules).quantityText, '1 ½ kg');
});

test('a trailing dot, case and leading spaces are accepted', () => {
  assert.deepEqual(parseIngredient('  2 El. olie', defaultRules), { quantityText: '2 El.', amount: 2, unit: 'el', name: 'olie' });
  assert.equal(parseIngredient('250g bloem', defaultRules).unit, 'g');
});

test('a line that is only a number has an empty name', () => {
  assert.deepEqual(parseIngredient('250 g', defaultRules), { quantityText: '250 g', amount: 250, unit: 'g', name: '' });
  assert.equal(parseIngredient('3', defaultRules).name, '');
});

test('joinIngredient puts the quantity before the name', () => {
  assert.equal(joinIngredient({ quantityText: '250 g', name: 'bloem' }), '250 g bloem');
  assert.equal(joinIngredient({ quantityText: '', name: 'zout' }), 'zout');
});
