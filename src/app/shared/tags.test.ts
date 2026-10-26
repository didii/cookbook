import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { compareTags, sortTags } from './tags';

describe('sortTags', () => {
  test('ignores letter case', () => {
    assert.deepEqual(sortTags(['winter', 'Soep', 'Bakken']), ['Bakken', 'Soep', 'winter']);
  });

  test('ignores accents', () => {
    assert.deepEqual(sortTags(['Zoet', 'Éclair', 'Eten']), ['Éclair', 'Eten', 'Zoet']);
  });

  test('does not change the given list', () => {
    const tags = ['b', 'a'];
    sortTags(tags);
    assert.deepEqual(tags, ['b', 'a']);
  });
});

describe('compareTags', () => {
  test('orders like sortTags', () => {
    assert.ok(compareTags('Soep', 'winter') < 0);
    assert.ok(compareTags('winter', 'Soep') > 0);
  });
});
