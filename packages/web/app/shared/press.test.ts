import assert from 'node:assert/strict';
import { test } from 'node:test';
import { press } from './press';

test('press class has the shadow, timing, pressed state and reduced motion', () => {
  const classes = press.split(' ');
  for (const c of [
    'shadow-hard-sm',
    'transition-[translate,box-shadow]',
    'duration-80',
    'active:not-disabled:translate-[3px_3px]',
    'active:not-disabled:shadow-none',
    'motion-reduce:transition-none',
  ])
    assert.ok(classes.includes(c), c);
});
