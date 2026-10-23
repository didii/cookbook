import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tabForKey, tabFromHash } from './tabs';

test('a location hash names a tab, any other hash none', () => {
  assert.equal(tabFromHash('#steps'), 'steps');
  assert.equal(tabFromHash('#ingredients'), 'ingredients');
  assert.equal(tabFromHash(''), undefined);
  assert.equal(tabFromHash('#step-3'), undefined);
});

test('tabForKey', () => {
  assert.equal(tabForKey('ingredients', 'ArrowRight'), 'steps');
  assert.equal(tabForKey('steps', 'ArrowRight'), 'ingredients');
  assert.equal(tabForKey('ingredients', 'ArrowLeft'), 'steps');
  assert.equal(tabForKey('steps', 'Home'), 'ingredients');
  assert.equal(tabForKey('ingredients', 'End'), 'steps');
  assert.equal(tabForKey('ingredients', 'a'), undefined);
});
