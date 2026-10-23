import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { dropIndex } from './dropIndex';

const mids = [10, 70, 130, 190];

describe('dropIndex', () => {
  describe('a row dragged less than half a row stays where it is', () => {
    test('pointer on its own middle', () => {
      assert.equal(dropIndex(mids, 1, 70), 1);
    });

    test('pointer a little below its middle', () => {
      assert.equal(dropIndex(mids, 1, 90), 1);
    });

    test('pointer a little above its middle', () => {
      assert.equal(dropIndex(mids, 1, 50), 1);
    });
  });

  describe('a row dragged past the middle of another takes its place', () => {
    test('down past the next row', () => {
      assert.equal(dropIndex(mids, 1, 140), 2);
    });

    test('down past the last row', () => {
      assert.equal(dropIndex(mids, 1, 500), 3);
    });

    test('up to the first row', () => {
      assert.equal(dropIndex(mids, 2, 5), 0);
    });

    test('up past one row', () => {
      assert.equal(dropIndex(mids, 3, 60), 1);
    });
  });
});

// Needs a browser and a mouse: the pointer events, the row following the pointer, Escape.
test.todo('recipe-ingredient-editing › Row can be dragged');
// Needs a browser: the (hover: none) media query.
test.todo('recipe-ingredient-editing › Grip hidden on touch screens');
