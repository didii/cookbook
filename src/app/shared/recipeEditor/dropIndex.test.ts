import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dropIndex } from './dropIndex';

const mids = [10, 70, 130, 190];

test('a row dragged less than half a row stays where it is', () => {
  assert.equal(dropIndex(mids, 1, 70), 1);
  assert.equal(dropIndex(mids, 1, 90), 1);
  assert.equal(dropIndex(mids, 1, 50), 1);
});

test('a row dragged past the middle of another takes its place', () => {
  assert.equal(dropIndex(mids, 1, 140), 2);
  assert.equal(dropIndex(mids, 1, 500), 3);
  assert.equal(dropIndex(mids, 2, 5), 0);
  assert.equal(dropIndex(mids, 3, 60), 1);
});

// Needs a browser and a mouse: the pointer events, the row following the pointer, Escape.
test.todo('recipe-ingredient-editing › Row can be dragged');
// Needs a browser: the (hover: none) media query.
test.todo('recipe-ingredient-editing › Grip hidden on touch screens');
