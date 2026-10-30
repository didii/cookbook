import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cleanEntry, fold, sameEntry } from './fold';

describe('fold', () => {
  test('drops accents and case', () => {
    assert.equal(fold('Crème Fraîche'), 'creme fraiche');
  });
});

describe('cleanEntry', () => {
  test('trims and makes runs of spaces one', () => {
    assert.equal(cleanEntry('  rode   ui '), 'rode ui');
  });
});

describe('sameEntry', () => {
  test('ignores case and accents', () => {
    assert.ok(sameEntry('Crème', 'creme'));
  });

  test('tells different words apart', () => {
    assert.ok(!sameEntry('ui', 'uien'));
  });
});
