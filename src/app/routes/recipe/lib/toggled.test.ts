import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { toggled } from './toggled';

describe('toggled', () => {
  test('adds a value that is not in the set', () => {
    assert.deepEqual([...toggled(new Set([1]), 3)], [1, 3]);
  });

  test('removes a value that is in the set', () => {
    assert.deepEqual([...toggled(new Set([1, 3]), 3)], [1]);
  });

  test('leaves the original set alone', () => {
    const set = new Set([1]);
    toggled(set, 3);
    assert.deepEqual([...set], [1]);
  });
});
