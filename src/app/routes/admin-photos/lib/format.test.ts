import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { formatSize, photoCount } from './format';

describe('formatSize', () => {
  test('gives kilobytes under a megabyte', () => {
    assert.equal(formatSize(180_400), '180 kB');
  });

  test('gives megabytes with one decimal from a megabyte', () => {
    assert.equal(formatSize(1_250_000), '1,3 MB');
  });
});

describe('photoCount', () => {
  test('is singular for one', () => {
    assert.equal(photoCount(1), '1 foto');
  });

  test('is plural otherwise', () => {
    assert.equal(photoCount(0), "0 foto's");
    assert.equal(photoCount(12), "12 foto's");
  });
});
