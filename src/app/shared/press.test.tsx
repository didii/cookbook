import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { press } from './press';

/** Rules whose selector ends in the given pseudo-classes (or nothing), as [selector, body]. */
const rules = (css: string) => [...css.matchAll(/^\s*(\.[^{\n]+)\{([^}]*)\}/gm)].map(([, s, b]) => [s.trim(), b] as const);
const pressed = (css: string) => rules(css).filter(([s]) => s.endsWith(':active:not(:disabled)'));

describe('press', () => {
  test('has reduced motion', async () => {
    assert.match(await cssFor(press), /prefers-reduced-motion: reduce/);
  });
});

describe('button-press › Pressing a shadowed button', () => {
  // Moves by the shadow's offset (3px 3px) and loses the shadow.
  const pressedBody = async () =>
    pressed(await cssFor(press))
      .map(([, b]) => b)
      .join('\n');

  test('it moves by the shadow offset', async () => {
    assert.match(await pressedBody(), /translate:\s*3px 3px/);
  });

  test('it loses the shadow', async () => {
    assert.match(await pressedBody(), /--tw-shadow:\s*0 0 #0000/);
  });
});

describe('button-press › Releasing a pressed button', () => {
  // Only the :active rules move or unshadow the button, so letting go returns it to rest.
  test('no resting rule moves the button', async () => {
    const resting = rules(await cssFor(press)).filter(([s]) => !s.includes(':active'));
    assert.ok(resting.length > 0);
    for (const [, body] of resting) assert.doesNotMatch(body, /translate:/);
  });

  test('the resting shadow is back', async () => {
    assert.match(await cssFor(press), /--tw-shadow:\s*3px 3px 0/);
  });
});

describe('button-press › Expanded button at rest', () => {
  // Expanded is colour only: no rule reacts to aria attributes, and aria-expanded changes no class.
  test('no rule reacts to aria attributes', async () => {
    assert.doesNotMatch(await cssFor(press), /aria-/);
  });
});

describe('button-press › Disabled button', () => {
  test('the pressed rules exist', async () => {
    assert.ok(pressed(await cssFor(press)).length >= 2);
  });

  // Every moving or unshadowing rule is guarded by :not(:disabled); there is no bare :active rule.
  test('there is no :active rule without the disabled guard', async () => {
    assert.deepEqual(
      rules(await cssFor(press)).filter(([s]) => s.includes(':active') && !s.endsWith(':active:not(:disabled)')),
      [],
    );
  });
});

describe('button-press › Reduced motion preference', () => {
  test('transitions are off', async () => {
    assert.match(await cssFor(press), /@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*transition-property: none/);
  });
});
