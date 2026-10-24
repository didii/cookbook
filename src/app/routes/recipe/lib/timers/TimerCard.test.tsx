import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { precedes, render, screen } from '~testing/dom';
import { TimerCard } from './TimerCard';
import { formatCountdown, type TimerView } from './timers';
import { TimersContext, type TimerControls } from './timersContext';

const timer = { id: '1', step: 1, minutes: 30, label: 'Deeg rust' };
const running: TimerView = { ...timer, state: 'running', remainingMs: 25 * 60_000 };
const finished: TimerView = { ...timer, state: 'finished', remainingMs: 0 };
const handedOver: TimerView = { ...timer, state: 'native', remainingMs: 872_000 };

/** Controls that show `view` for the timer of step two. */
const controlsFor = (view: TimerView, clock: TimerControls['clock'] = { available: false, auto: false, setAuto() {} }): TimerControls => ({
  active: [view],
  view: () => view,
  start() {},
  add() {},
  stop() {},
  handOver() {},
  undoHandOver() {},
  clock,
});

const card = (view: TimerView, clock?: TimerControls['clock']) =>
  render(
    <TimersContext value={controlsFor(view, clock)}>
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

describe('TimerCard clock app control', () => {
  test('is not offered where the clock app cannot be started', () => {
    card(running);
    assert.equal(screen.queryByTestId('TimerCard-app'), null);
  });

  test('is offered where the clock app can be started', () => {
    card(running, { available: true, auto: false, setAuto() {} });
    assert.ok(screen.getByTestId('TimerCard-app').getAttribute('aria-label'));
  });
});

describe('TimerCard handed over timer', () => {
  const handed = () => card(handedOver);

  test('is a note with the time left', () => {
    handed();
    assert.ok(screen.getByTestId('TimerCard-note').textContent!.includes(formatCountdown(handedOver.remainingMs)));
  });

  test('can be undone or wiped', () => {
    handed();
    assert.equal(screen.getByTestId('TimerCard-restore').textContent, 'Herstel');
    assert.equal(screen.getByTestId('TimerCard-wipe').textContent, 'Wis');
  });

  test('has buttons whose labels say the app timer keeps running', () => {
    handed();
    assert.ok(screen.getByTestId('TimerCard-restore').getAttribute('aria-label'));
    assert.ok(screen.getByTestId('TimerCard-wipe').getAttribute('aria-label'));
  });

  test('has the label below the note', () => {
    handed();
    assert.equal(screen.getByTestId('TimerCard-noteLabel').textContent, 'Deeg rust');
    assert.ok(precedes(screen.getByTestId('TimerCard-note'), screen.getByTestId('TimerCard-noteLabel')));
  });

  test('has no stop or add buttons', () => {
    handed();
    assert.equal(screen.queryByTestId('TimerCard-stop'), null);
    assert.equal(screen.queryByTestId('TimerCard-add1'), null);
  });

  test('with timers always in the app, undoing says it runs here', () => {
    card(handedOver, { available: true, auto: true, setAuto() {} });
    assert.equal(screen.getByTestId('TimerCard-restore').textContent, 'Hier laten lopen');
  });
});

// Need layout: the card sits on its own line below the label on a narrow screen, and the chip shows the countdown on a wide one.
test.todo('step-timers › Timer card on a narrow screen');
test.todo('step-timers › Countdown in the chip on a wide screen');
