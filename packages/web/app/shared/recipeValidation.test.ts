import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readIngredients, validate } from './recipeValidation';

const ok = { title: 'Soep', author: 'Oma', servings: '4', time: '', intro: '', image: '' };

test('recipe-creation › Missing title', () => {
  assert.deepEqual(Object.keys(validate({ ...ok, title: '' })), ['title']);
});

test('recipe-creation › Invalid servings', () => {
  for (const servings of ['0', '-2', '2.5', 'veel']) assert.deepEqual(Object.keys(validate({ ...ok, servings })), ['servings'], servings);
});

test('validate accepts empty servings and a missing author is reported', () => {
  assert.deepEqual(validate({ ...ok, servings: '' }), {});
  assert.deepEqual(Object.keys(validate({ ...ok, author: '' })), ['author']);
});

const formWith = (json: string) => {
  const form = new FormData();
  form.set('ingredients', json);
  return form;
};
const post = (rows: unknown) => readIngredients(formWith(JSON.stringify(rows)));

test('recipe-ingredient-editing › Blank rows are not stored', () => {
  const { ingredients, errors } = post([{ text: '' }, { text: '250 g bloem' }, { text: '  ' }, { text: 'zout' }, { text: '' }]);
  assert.deepEqual(
    ingredients?.map((i) => i.name),
    ['bloem', 'zout'],
  );
  assert.deepEqual(errors, {});
});

test('recipe-ingredient-editing › Quantity without a name is refused', () => {
  const { errors } = post([{ text: 'zout' }, { text: '250 g' }]);
  assert.deepEqual(errors, { 1: 'Vul bij "250 g" ook een naam in.' });
});

test('the server parses the text itself and ignores a missing or malformed list', () => {
  assert.deepEqual(post([{ text: '2 el. olie', quantityText: 'x' }]).ingredients, [{ quantityText: '2 el.', amount: 2, unit: 'el', name: 'olie' }]);
  assert.deepEqual(post('nope').lines, []);
  assert.deepEqual(readIngredients(new FormData()).lines, []);
  assert.deepEqual(readIngredients(formWith('{')).lines, []);
});

test('a missing or malformed ingredients field is "not given", an empty list is "none"', () => {
  assert.equal(readIngredients(new FormData()).ingredients, undefined);
  assert.equal(readIngredients(formWith('{')).ingredients, undefined);
  assert.equal(post('nope').ingredients, undefined);
  assert.deepEqual(post([]).ingredients, []);
});
