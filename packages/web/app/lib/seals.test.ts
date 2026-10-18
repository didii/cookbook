import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickSeal, seals } from './seals';

test('picks among the least used seals', () => {
  const existing = [seals[0], seals[0], seals[1], seals[2], seals[3]];
  const unused = seals.slice(4);
  for (const r of [0, 0.5, 0.999]) assert.ok(unused.includes(pickSeal(existing, () => r)));
});

test('can pick every one of the least used seals', () => {
  const picked = new Set([0, 0.25, 0.5, 0.75, 0.999].map((r) => pickSeal([], () => r)));
  assert.ok(picked.size > 1);
});

test('works when every seal has been used', () => {
  const existing = [...seals, ...seals.slice(0, 5)];
  for (const r of [0, 0.999]) assert.ok(seals.indexOf(pickSeal(existing, () => r)) >= 5);
});
