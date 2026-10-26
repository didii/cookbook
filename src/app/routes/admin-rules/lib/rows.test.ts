import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { ensureFree, isEmptyItem } from './rows';

const blank = () => ({ id: 'new', text: '' });

describe('isEmptyItem', () => {
  test('a row without text and minutes is empty', () => {
    assert.equal(isEmptyItem({ id: 'a', text: ' ', minutes: '' }), true);
  });

  test('minutes alone make a row filled in', () => {
    assert.equal(isEmptyItem({ id: 'a', text: '', minutes: '15' }), false);
  });
});

describe('ensureFree', () => {
  test('adds an empty row after a filled-in one', () => {
    assert.deepEqual(ensureFree([{ id: 'a', text: 'g' }], blank), [{ id: 'a', text: 'g' }, blank()]);
  });

  test('keeps a list that already ends in an empty row', () => {
    const rows = [
      { id: 'a', text: 'g' },
      { id: 'b', text: '' },
    ];
    assert.equal(ensureFree(rows, blank), rows);
  });

  test('gives an empty list one empty row', () => {
    assert.deepEqual(ensureFree([], blank), [blank()]);
  });
});
