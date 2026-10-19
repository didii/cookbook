import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Step } from '~/lib/recipes';
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
  const html = renderToStaticMarkup(createElement(TimerDock, { timers, onJump() {} }));
  assert.ok(html.indexOf('Stap 2, Deeg rust, 29:00') < html.indexOf('Stap 10, Bakken, 49:00'));
  assert.ok(!html.includes('hidden=""'));
  assert.ok(renderToStaticMarkup(createElement(TimerDock, { timers: [], onJump() {} })).includes('hidden=""'));
});

test('the sidebar lists the timers with their controls and a jump to the step', () => {
  const html = renderToStaticMarkup(createElement(TimerSidebar, { timers, onJump() {}, onPeek() {} }));
  assert.equal(html.match(/aria-label="Ga naar stap/g)?.length, 2);
  assert.ok(html.includes('Eén minuut erbij') && html.includes('Vijf minuten erbij') && html.includes('>Stop<'));
  assert.equal(renderToStaticMarkup(createElement(TimerSidebar, { timers: [], onJump() {}, onPeek() {} })), '');
});

// Need a browser: they depend on which steps are on screen (IntersectionObserver) and on the layout.
test.todo('step-timers › Timer docks when its step leaves the screen');
test.todo('step-timers › Timer undocks when its step returns');
test.todo('step-timers › Docked timers on the other tab');
test.todo('step-timers › Timers in the sidebar on a wide screen');
// Needs a browser: the animation must not replay when siblings change.
test.todo('step-timers › Only a new timer animates');
// Need a browser: scrolling to the step and the highlight fade.
test.todo('step-timers › Go to the step of a timer');
test.todo('recipe-viewing › Step is highlighted');
