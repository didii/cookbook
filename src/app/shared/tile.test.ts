import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { tileSteps } from './tile';

describe('tileSteps', () => {
  test('the ratio of two tile rows is half the tile count, from the width that shows that count', () => {
    for (const [count, show, ratio] of tileSteps) {
      const from = /(@min-\[\w+\]:)?block/.exec(show)?.[1] ?? '';
      assert.equal(ratio, `${from}aspect-${count / 2}/1`);
    }
  });
});
