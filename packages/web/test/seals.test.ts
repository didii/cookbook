import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickSeal, seals } from '../app/lib/seals.ts';

test('skips the last three seals and picks among the least used', () => {
  const existing = [seals[0], seals[0], seals[1], seals[2], seals[3]];
  const unused = seals.slice(4);
  for (const r of [0, 0.5, 0.999]) assert.ok(unused.includes(pickSeal(existing, () => r)));
});

test('works when every seal has been used', () => {
  const existing = [...seals, ...seals.slice(0, 5)];
  const picked = pickSeal(existing, () => 0);
  assert.ok(!existing.slice(-3).includes(picked));
  assert.ok(seals.indexOf(picked) >= 5);
});
