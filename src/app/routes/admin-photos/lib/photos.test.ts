import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { readFilters, withFilter } from './photos';

describe('photo filters', () => {
  test('both are on when the address has none', () => {
    assert.deepEqual(readFilters(new URLSearchParams()), { onlyUnused: true, onlyOld: true });
  });

  test('=0 turns one off', () => {
    assert.deepEqual(readFilters(new URLSearchParams('ongebruikt=0')), { onlyUnused: false, onlyOld: true });
    assert.deepEqual(readFilters(new URLSearchParams('ouder=0')), { onlyUnused: true, onlyOld: false });
  });

  test('turning one off puts it in the address and turning it on takes it out', () => {
    const off = withFilter(new URLSearchParams('x=1'), 'onlyOld', false);
    assert.equal(off.toString(), 'x=1&ouder=0');
    assert.equal(withFilter(off, 'onlyOld', true).toString(), 'x=1');
  });
});
