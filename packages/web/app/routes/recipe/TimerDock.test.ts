import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { createElement } from 'react';
import type { Step } from '~/lib/recipe';
import { activeTimers, start, timerDefs } from '~/lib/timers';
import { TimerDock } from './TimerDock';
import { TimerSidebar } from './TimerSidebar';

const steps: Step[] = Array.from({ length: 10 }, (_, i) => ({
  body: `stap ${i + 1}`,
  ingredients: [],
  timer: i === 1 ? { minutes: 30, label: 'Deeg rust' } : i === 9 ? { minutes: 50, label: 'Bakken' } : undefined,
}));
const defs = timerDefs(steps);
const T0 = 1_000_000;
const timers = activeTimers(defs, start(start({}, defs[1], T0), defs[0], T0), T0 + 60_000);

test('the dock holds a pill per timer, earlier steps first, and is hidden when empty', () => {
  const jumped: number[] = [];
  const { container } = render(createElement(TimerDock, { timers, onJump: (step) => jumped.push(step) }));
  const second = screen.getByRole('button', { name: /^Stap 2, Deeg rust, 29:00/ });
  const tenth = screen.getByRole('button', { name: /^Stap 10, Bakken, 49:00/ });
  assert.ok(precedes(second, tenth));
  assert.equal(container.querySelector('nav')!.hidden, false);
  // A pill goes to the step of its timer.
  fireEvent.click(tenth);
  assert.deepEqual(jumped, [9]);
  assert.equal(render(createElement(TimerDock, { timers: [], onJump() {} })).container.querySelector('nav')!.hidden, true);
});

test('the sidebar lists the timers with their controls and a jump to the step', () => {
  const jumped: number[] = [];
  const { container } = render(createElement(TimerSidebar, { timers, onJump: (step) => jumped.push(step), onPeek() {} }));
  assert.equal(screen.getAllByRole('button', { name: /^Ga naar stap/ }).length, 2);
  assert.equal(screen.getAllByRole('button', { name: 'Eén minuut erbij' }).length, 2);
  assert.equal(screen.getAllByRole('button', { name: 'Vijf minuten erbij' }).length, 2);
  assert.equal(screen.getAllByRole('button', { name: 'Stop timer' }).length, 2);
  fireEvent.click(screen.getByRole('button', { name: 'Ga naar stap 2' }));
  assert.deepEqual(jumped, [1]);
  assert.equal(container.querySelectorAll('li').length, 2);
  assert.equal(render(createElement(TimerSidebar, { timers: [], onJump() {}, onPeek() {} })).container.firstChild, null);
});

// Need a browser: they depend on which steps are on screen, which IntersectionObserver reports from real layout; a DOM without layout reports nothing.
test.todo('step-timers › Timer docks when its step leaves the screen');
test.todo('step-timers › Timer undocks when its step returns');
test.todo('step-timers › Docked timers on the other tab');
test.todo('step-timers › Timers in the sidebar on a wide screen');
// Needs a browser: the animation must not replay when siblings change.
test.todo('step-timers › Only a new timer animates');
// Need a browser: scrolling to the step and the highlight fade.
test.todo('step-timers › Go to the step of a timer');
test.todo('recipe-viewing › Step is highlighted');
