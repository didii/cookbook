import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { pickSeal, seals } from './seals';

describe('pickSeal', () => {
  describe('picks among the least used seals', () => {
    const existing = [{ seal: seals[0], count: 2 }, ...seals.slice(1, 4).map((seal) => ({ seal, count: 1 }))];
    const unused = seals.slice(4);
    for (const r of [0, 0.5, 0.999])
      test(`random ${r} gives an unused seal`, () => {
        assert.ok(unused.includes(pickSeal(existing, () => r)));
      });
  });

  test('can pick every one of the least used seals', () => {
    const picked = new Set([0, 0.25, 0.5, 0.75, 0.999].map((r) => pickSeal([], () => r)));
    assert.ok(picked.size > 1);
  });

  describe('works when every seal has been used', () => {
    const existing = seals.map((seal, i) => ({ seal, count: i < 5 ? 2 : 1 }));
    for (const r of [0, 0.999])
      test(`random ${r} gives a least used seal`, () => {
        assert.ok(seals.indexOf(pickSeal(existing, () => r)) >= 5);
      });
  });
});
