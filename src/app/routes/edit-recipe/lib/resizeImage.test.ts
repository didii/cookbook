import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fitWithin } from './resizeImage';

describe('recipe-photo › Large photo is shrunk', () => {
  test('a landscape photo is limited on its longest side', () => {
    assert.deepEqual(fitWithin(4000, 3000, 1600), { width: 1600, height: 1200 });
  });
});

describe('recipe-photo › Small photo is not enlarged', () => {
  test('a photo within the limit keeps its size', () => {
    assert.deepEqual(fitWithin(800, 600, 1600), { width: 800, height: 600 });
  });
});

describe('fitWithin', () => {
  describe('portrait and square photos are limited on their longest side', () => {
    test('portrait', () => {
      assert.deepEqual(fitWithin(3000, 4000, 1600), { width: 1200, height: 1600 });
    });

    test('square above the limit', () => {
      assert.deepEqual(fitWithin(3000, 3000, 1600), { width: 1600, height: 1600 });
    });

    test('square exactly at the limit', () => {
      assert.deepEqual(fitWithin(1600, 1600, 1600), { width: 1600, height: 1600 });
    });
  });

  describe('dimensions are whole pixels and never zero', () => {
    test('rounds to whole pixels', () => {
      assert.deepEqual(fitWithin(1601, 1000, 1600), { width: 1600, height: 999 });
    });

    test('a very flat photo keeps at least one pixel', () => {
      assert.deepEqual(fitWithin(10000, 1, 1600), { width: 1600, height: 1 });
    });
  });
});
