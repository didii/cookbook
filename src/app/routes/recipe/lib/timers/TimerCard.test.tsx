import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
import { precedes, render, screen } from '~testing/dom';
import { activeTimers, handOver, start, timerDefs, timerView } from './timers';
import { TimersContext, type TimerControls } from './timersContext';
import { ClockSetting } from '../ClockSetting';
import { StepItem } from '../StepItem';

const steps: Step[] = [
  { body: 'Meng het deeg.', ingredients: [] },
  { body: 'Laat het deeg 30 minuten rusten.', ingredients: [], timer: { minutes: 30, label: 'Deeg rust' } },
];
const defs = timerDefs(steps);
const T0 = 1_000_000;

/** Controls over a fixed set of timers as they are at `now`. */
const controlsAt = (now: number, timers = start({}, defs[0], T0)): TimerControls => ({
  active: activeTimers(defs, timers, now),
  view: (id) =>
    timerView(
      timers,
      defs.find((d) => d.id === id)!,
      now,
    ),
  start() {},
  add() {},
  stop() {},
  handOver() {},
  undoHandOver() {},
  clock: { available: false, auto: false, setAuto() {} },
});

const stepTwo = (controls: TimerControls) =>
  render(
    <TimersContext value={controls}>
      <StepItem step={steps[1]} number={2} done={false} onToggle={() => {}} />
    </TimersContext>,
  );

describe('TimerCard running timer', () => {
  const running = () => stepTwo(controlsAt(T0 + 5 * 60_000));

  test('is a group card showing the time left', () => {
    running();
    assert.equal(screen.getByTestId('TimerCard-card').getAttribute('role'), 'group');
    assert.ok(screen.getByTestId('TimerCard-card').textContent!.includes('25:00'));
  });

  test('has labelled buttons to add one and five minutes', () => {
    running();
    assert.equal(screen.getByTestId('TimerCard-add1').getAttribute('aria-label'), 'Eén minuut erbij');
    assert.equal(screen.getByTestId('TimerCard-add5').getAttribute('aria-label'), 'Vijf minuten erbij');
  });

  test('has a stop button', () => {
    running();
    assert.match(screen.getByTestId('TimerCard-stop').textContent!, /Stop/);
  });

  test('has a countdown chip', () => {
    running();
    assert.equal(screen.getByTestId('TimerChip-countdown').getAttribute('role'), 'timer');
    assert.equal(screen.getByTestId('TimerChip-countdown').textContent, '25:00');
  });

  test('has no start button', () => {
    running();
    assert.equal(screen.queryByTestId('TimerChip-start'), null);
  });
});

describe('TimerCard finished timer', () => {
  test('is an alert that says so in words, with the step number', () => {
    stepTwo(controlsAt(T0 + 31 * 60_000));
    assert.equal(screen.getByTestId('TimerCard-card').getAttribute('role'), 'alert');
    assert.ok(screen.getByTestId('TimerCard-card').textContent?.includes('Stap 2 klaar'));
    assert.equal(screen.getByTestId('TimerCard-done').textContent, 'Klaar');
  });
});

describe('TimerCard idle timer', () => {
  test('is a labelled start button', () => {
    stepTwo(controlsAt(T0, {}));
    assert.equal(screen.getByTestId('TimerChip-start').getAttribute('aria-label'), 'Start timer van 30 min, Deeg rust');
  });

  test('has no card', () => {
    stepTwo(controlsAt(T0, {}));
    assert.equal(screen.queryByTestId('TimerCard-card'), null);
  });
});

describe('TimerCard clock app control', () => {
  const running = controlsAt(T0 + 5 * 60_000);

  test('is not offered where the clock app cannot be started', () => {
    stepTwo(running);
    assert.equal(screen.queryByTestId('TimerCard-app'), null);
  });

  test('is offered where the clock app can be started', () => {
    stepTwo({ ...running, clock: { available: true, auto: false, setAuto() {} } });
    assert.match(screen.getByTestId('TimerCard-app').getAttribute('aria-label')!, /klok-app/);
  });

  test('has no setting without it', () => {
    assert.equal(render(<ClockSetting />).container.firstChild, null);
  });
});

describe('TimerCard handed over timer', () => {
  const handed = () => stepTwo(controlsAt(T0, handOver({}, defs[0].id, 872_000, T0)));

  test('is a note with the time left', () => {
    handed();
    assert.match(screen.getByTestId('TimerCard-note').textContent!, /In je app · 14:32/);
  });

  test('can be undone or wiped', () => {
    handed();
    assert.equal(screen.getByTestId('TimerCard-restore').textContent, 'Herstel');
    assert.equal(screen.getByTestId('TimerCard-wipe').textContent, 'Wis');
  });

  test('has buttons whose labels say the app timer keeps running', () => {
    handed();
    assert.match(screen.getByTestId('TimerCard-restore').getAttribute('aria-label')!, /Laat de timer hier verder lopen.*loopt door/);
    assert.match(screen.getByTestId('TimerCard-wipe').getAttribute('aria-label')!, /Wis deze notitie.*loopt door/);
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
    stepTwo({ ...controlsAt(T0, handOver({}, defs[0].id, 872_000, T0)), clock: { available: true, auto: true, setAuto() {} } });
    assert.equal(screen.getByTestId('TimerCard-restore').textContent, 'Hier laten lopen');
  });
});

// Need layout: the card sits on its own line below the label on a narrow screen, and the chip shows the countdown on a wide one.
test.todo('step-timers › Timer card on a narrow screen');
test.todo('step-timers › Countdown in the chip on a wide screen');
