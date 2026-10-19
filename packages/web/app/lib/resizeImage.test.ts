import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fitWithin } from './resizeImage';

test('recipe-photo › Large photo is shrunk', () => {
  assert.deepEqual(fitWithin(4000, 3000, 1600), { width: 1600, height: 1200 });
});

test('recipe-photo › Small photo is not enlarged', () => {
  assert.deepEqual(fitWithin(800, 600, 1600), { width: 800, height: 600 });
});

test('portrait and square photos are limited on their longest side', () => {
  assert.deepEqual(fitWithin(3000, 4000, 1600), { width: 1200, height: 1600 });
  assert.deepEqual(fitWithin(3000, 3000, 1600), { width: 1600, height: 1600 });
  assert.deepEqual(fitWithin(1600, 1600, 1600), { width: 1600, height: 1600 });
});

test('dimensions are whole pixels and never zero', () => {
  assert.deepEqual(fitWithin(1601, 1000, 1600), { width: 1600, height: 999 });
  assert.deepEqual(fitWithin(10000, 1, 1600), { width: 1600, height: 1 });
});
