import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { filterParams, type Filters } from './filterParams';

const none: Filters = {};

describe('filterParams', () => {
  test('leaves out defaults', () => {
    assert.equal(filterParams(none).toString(), '');
  });

  test('writes a non-default order', () => {
    assert.equal(filterParams({ sort: 'az' }).toString(), 'sort=az');
  });
});
