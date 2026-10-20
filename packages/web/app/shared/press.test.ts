import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

// Which elements get the class: the shadowed buttons use it, chips (no shadow) do not exist yet and will not get it.
const source = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('button-press › Pressing a shadowed button', () => {
  assert.match(press, /active:not-disabled:translate-\[3px_3px\]/);
  assert.match(press, /active:not-disabled:shadow-none/);
  assert.match(source('./Button.tsx'), /\bpress\b/);
  assert.match(source('../routes/recipe/TimerChip.tsx'), /\bpress\b/);
});

test('button-press › Releasing a pressed button', () => {
  // The pressed state is only the :active variant, so releasing or moving off returns to the resting shadow and position.
  assert.doesNotMatch(press.replace(/active:\S+/g, ''), /translate-\[/);
  assert.match(press, /\bshadow-hard-sm\b/);
});

test('button-press › Expanded button at rest', () => {
  // Selected and expanded states are colour only: the press class holds no aria-expanded or aria-pressed variant.
  assert.doesNotMatch(press, /aria-/);
});

test('button-press › Disabled button', () => {
  assert.doesNotMatch(press, /active:(?!not-disabled)/);
});

test('button-press › Reduced motion preference', () => {
  assert.match(press, /motion-reduce:transition-none/);
});

test('button-press › Pressing a chip', () => {
  // There are no filter chips yet; the press class is only added by name, so a chip without it does not move.
  assert.doesNotMatch(source('../routes/recipe/TabBar.tsx'), /\bpress\b/);
});
