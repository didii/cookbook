import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { tabForKey, tabFromHash } from './tabs';

describe('tabFromHash', () => {
  test('a location hash names a tab', () => {
    assert.equal(tabFromHash('#steps'), 'steps');
    assert.equal(tabFromHash('#ingredients'), 'ingredients');
  });

  test('an empty hash names none', () => {
    assert.equal(tabFromHash(''), undefined);
  });

  test('any other hash names none', () => {
    assert.equal(tabFromHash('#step-3'), undefined);
  });
});

describe('tabForKey', () => {
  test('ArrowRight moves to the next tab, wrapping around', () => {
    assert.equal(tabForKey('ingredients', 'ArrowRight'), 'steps');
    assert.equal(tabForKey('steps', 'ArrowRight'), 'ingredients');
  });

  test('ArrowLeft moves to the previous tab, wrapping around', () => {
    assert.equal(tabForKey('ingredients', 'ArrowLeft'), 'steps');
  });

  test('Home goes to the first tab', () => {
    assert.equal(tabForKey('steps', 'Home'), 'ingredients');
  });

  test('End goes to the last tab', () => {
    assert.equal(tabForKey('ingredients', 'End'), 'steps');
  });

  test('any other key changes nothing', () => {
    assert.equal(tabForKey('ingredients', 'a'), undefined);
  });
});
