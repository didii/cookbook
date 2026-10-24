import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { TimerDock } from './TimerDock';
import { formatCountdown, type TimerView } from './timers';

const timers: TimerView[] = [
  { id: '1', step: 1, minutes: 30, label: 'Deeg rust', state: 'running', remainingMs: 29 * 60_000 },
  { id: '9', step: 9, minutes: 50, label: 'Bakken', state: 'running', remainingMs: 49 * 60_000 },
];

describe('TimerDock', () => {
  test('holds a pill per timer', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    assert.equal(screen.getAllByTestId('TimerDock-pill').length, 2);
  });

  test('describes each pill with step, label and time left', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    const [second, tenth] = screen.getAllByTestId('TimerDock-pill');
    for (const [pill, t] of [
      [second, timers[0]],
      [tenth, timers[1]],
    ] as const) {
      const label = pill.getAttribute('aria-label')!;
      assert.ok([String(t.step + 1), t.label, formatCountdown(t.remainingMs)].every((part) => label.includes(part)));
    }
  });

  test('puts earlier steps first', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    const [second, tenth] = screen.getAllByTestId('TimerDock-pill');
    assert.ok(precedes(second, tenth));
  });

  test('is shown when it holds timers', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    assert.equal(screen.getByTestId('TimerDock-dock').hidden, false);
  });

  test('a pill goes to the step of its timer', () => {
    const jumped: number[] = [];
    render(<TimerDock timers={timers} onJump={(step) => jumped.push(step)} />);
    fireEvent.click(screen.getAllByTestId('TimerDock-pill')[1]);
    assert.deepEqual(jumped, [9]);
  });

  test('is hidden when empty', () => {
    render(<TimerDock timers={[]} onJump={() => {}} />);
    assert.equal(screen.getByTestId('TimerDock-dock').hidden, true);
  });
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
