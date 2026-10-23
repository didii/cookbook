import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Step } from '~app/lib/recipe';
import { activeTimers, start, timerDefs } from '~app/lib/timers';
import { fireEvent, precedes, render, screen, within } from '~testing/dom';
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
  render(<TimerDock timers={timers} onJump={(step) => jumped.push(step)} />);
  const [second, tenth] = screen.getAllByTestId('TimerDock-pill');
  assert.equal(screen.getAllByTestId('TimerDock-pill').length, 2);
  assert.match(second.getAttribute('aria-label')!, /^Stap 2, Deeg rust, 29:00/);
  assert.match(tenth.getAttribute('aria-label')!, /^Stap 10, Bakken, 49:00/);
  assert.ok(precedes(second, tenth));
  assert.equal(screen.getByTestId('TimerDock-dock').hidden, false);
  // A pill goes to the step of its timer.
  fireEvent.click(tenth);
  assert.deepEqual(jumped, [9]);
  assert.equal(within(render(<TimerDock timers={[]} onJump={() => {}} />).container).getByTestId('TimerDock-dock').hidden, true);
});

test('the sidebar lists the timers with their controls and a jump to the step', () => {
  const jumped: number[] = [];
  const { container } = render(<TimerSidebar timers={timers} onJump={(step) => jumped.push(step)} onPeek={() => {}} />);
  const jump = screen.getAllByTestId('SidebarCard-jump');
  assert.equal(jump.length, 2);
  assert.ok(jump.every((b) => b.getAttribute('aria-label')!.startsWith('Ga naar stap')));
  assert.equal(screen.getAllByTestId('SidebarCard-add1').length, 2);
  assert.equal(screen.getAllByTestId('SidebarCard-add5').length, 2);
  assert.equal(screen.getAllByTestId('SidebarCard-stop').length, 2);
  assert.ok(screen.getAllByTestId('SidebarCard-add1').every((b) => b.getAttribute('aria-label') === 'Eén minuut erbij'));
  assert.ok(screen.getAllByTestId('SidebarCard-add5').every((b) => b.getAttribute('aria-label') === 'Vijf minuten erbij'));
  assert.ok(screen.getAllByTestId('SidebarCard-stop').every((b) => b.getAttribute('aria-label') === 'Stop timer'));
  assert.equal(jump[0].getAttribute('aria-label'), 'Ga naar stap 2');
  fireEvent.click(jump[0]);
  assert.deepEqual(jumped, [1]);
  assert.equal(container.querySelectorAll('li').length, 2);
  assert.equal(render(<TimerSidebar timers={[]} onJump={() => {}} onPeek={() => {}} />).container.firstChild, null);
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
