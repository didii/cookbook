import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tabFromHash } from './tabs';

test('a location hash names a tab, any other hash none', () => {
  assert.equal(tabFromHash('#steps'), 'steps');
  assert.equal(tabFromHash('#ingredients'), 'ingredients');
  assert.equal(tabFromHash(''), undefined);
  assert.equal(tabFromHash('#step-3'), undefined);
});
