import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cssFor } from '~testing/css';
import { cleanup, render, screen } from '~testing/dom';
import { Button } from './components/Button';
import { press } from './press';

/** Rules whose selector ends in the given pseudo-classes (or nothing), as [selector, body]. */
const rules = (css: string) => [...css.matchAll(/^\s*(\.[^{\n]+)\{([^}]*)\}/gm)].map(([, s, b]) => [s.trim(), b] as const);
const pressed = (css: string) => rules(css).filter(([s]) => s.endsWith(':active:not(:disabled)'));

test('press class has the shadow, timing, pressed state and reduced motion', async () => {
  const css = await cssFor(press);
  assert.match(css, /3px 3px 0/);
  assert.match(css, /transition-property: translate,\s*box-shadow/);
  assert.match(css, /transition-duration: 80ms/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('button-press › Pressing a shadowed button', async () => {
  const rule = pressed(await cssFor(press));
  const body = rule.map(([, b]) => b).join('\n');
  // Moves by the shadow's offset (3px 3px) and loses the shadow.
  assert.match(body, /translate:\s*3px 3px/);
  assert.match(body, /--tw-shadow:\s*0 0 #0000/);
  // The real components carry every press class after class merging.
  render(<Button data-testid="button" />);
  const button = screen.getByTestId('button').className;
  for (const c of press.split(' ')) assert.ok(button.includes(c), c);
});

test('button-press › Releasing a pressed button', async () => {
  const css = await cssFor(press);
  // Only the :active rules move or unshadow the button, so letting go returns it to rest.
  const resting = rules(css).filter(([s]) => !s.includes(':active'));
  assert.ok(resting.length > 0);
  for (const [, body] of resting) assert.doesNotMatch(body, /translate:/);
  assert.match(css, /--tw-shadow:\s*3px 3px 0/);
});

test('button-press › Expanded button at rest', async () => {
  // Expanded is colour only: no rule reacts to aria attributes, and aria-expanded changes no class.
  assert.doesNotMatch(await cssFor(press), /aria-/);
  const rest = render(<Button data-testid="button" />).getByTestId('button').className;
  cleanup();
  render(<Button data-testid="button" aria-expanded />);
  assert.equal(screen.getByTestId('button').className, rest);
});

test('button-press › Disabled button', async () => {
  const rule = pressed(await cssFor(press));
  assert.ok(rule.length >= 2);
  // Every moving or unshadowing rule is guarded by :not(:disabled); there is no bare :active rule.
  assert.deepEqual(
    rules(await cssFor(press)).filter(([s]) => s.includes(':active') && !s.endsWith(':active:not(:disabled)')),
    [],
  );
});

test('button-press › Reduced motion preference', async () => {
  assert.match(await cssFor(press), /@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*transition-property: none/);
});
