import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { TimerCard } from './TimerCard';
import type { TimerView } from './timers';
import { TimersContext, type TimerControls } from './timersContext';

const timer = { id: '1', step: 1, minutes: 30, label: 'Deeg rust' };
const running: TimerView = { ...timer, state: 'running', remainingMs: 25 * 60_000 };
const finished: TimerView = { ...timer, state: 'finished', remainingMs: 0 };

/** Controls that show `view` for the timer of step two. */
const controlsFor = (view: TimerView): TimerControls => ({
  active: [view],
  view: () => view,
  start() {},
  add() {},
  stop() {},
});

const card = (view: TimerView) =>
  render(
    <TimersContext value={controlsFor(view)}>
      <TimerCard view={view} />
    </TimersContext>,
  );

describe('TimerCard running timer', () => {
  const show = () => card(running);

  test('is a group card showing the time left', () => {
    show();
    assert.equal(screen.getByTestId('TimerCard-card').getAttribute('role'), 'group');
    assert.ok(screen.getByTestId('TimerCard-card').textContent!.includes('25:00'));
  });

  test('has labelled buttons to add one and five minutes', () => {
    show();
    assert.equal(screen.getByTestId('TimerCard-add1').getAttribute('aria-label'), 'Eén minuut erbij');
    assert.equal(screen.getByTestId('TimerCard-add5').getAttribute('aria-label'), 'Vijf minuten erbij');
  });

  test('has a stop button', () => {
    show();
    assert.match(screen.getByTestId('TimerCard-stop').textContent!, /Stop/);
  });
});

describe('TimerCard finished timer', () => {
  test('is an alert that says so in words, with the step number', () => {
    card(finished);
    assert.equal(screen.getByTestId('TimerCard-card').getAttribute('role'), 'alert');
    assert.ok(screen.getByTestId('TimerCard-card').textContent?.includes('Stap 2 klaar'));
    assert.equal(screen.getByTestId('TimerCard-done').textContent, 'Klaar');
  });
});

// Need layout: the card sits on its own line below the label on a narrow screen, and the chip shows the countdown on a wide one.
test.todo('step-timers › Timer card on a narrow screen');
test.todo('step-timers › Countdown in the chip on a wide screen');
