import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validate } from './recipeValidation';

const ok = { title: 'Soep', author: 'Oma', servings: '4' };

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
