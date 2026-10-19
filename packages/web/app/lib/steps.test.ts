import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatMinutes } from './steps';

test('minutes under an hour show as min', () => {
  assert.deepEqual([5, 30, 59].map(formatMinutes), ['5 min', '30 min', '59 min']);
});

test('an hour or more shows as u, with the rest when there is one', () => {
  assert.deepEqual([60, 90, 125].map(formatMinutes), ['1 u', '1 u 30', '2 u 5']);
});
