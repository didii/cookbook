import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanup, precedes, render, screen } from '~testing/dom';
import type { Step } from '~app/lib/recipe';
import { activeTimers, handOver, start, timerDefs, timerView } from '~app/lib/timers';
import { ClockSetting } from './ClockSetting';
import { StepItem } from './StepItem';
import { TimersContext, type TimerControls } from './timersContext';

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

test('a running timer is a card with its controls and a countdown chip', () => {
  stepTwo(controlsAt(T0 + 5 * 60_000));
  assert.equal(screen.getByTestId('TimerCard-card').getAttribute('role'), 'group');
  assert.ok(screen.getByTestId('TimerCard-card').textContent!.includes('25:00'));
  assert.equal(screen.getByTestId('TimerCard-add1').getAttribute('aria-label'), 'Eén minuut erbij');
  assert.equal(screen.getByTestId('TimerCard-add5').getAttribute('aria-label'), 'Vijf minuten erbij');
  assert.match(screen.getByTestId('TimerCard-stop').textContent!, /Stop/);
  assert.equal(screen.getByTestId('TimerChip-countdown').getAttribute('role'), 'timer');
  assert.equal(screen.getByTestId('TimerChip-countdown').textContent, '25:00');
  // The start button is gone while it runs.
  assert.equal(screen.queryByTestId('TimerChip-start'), null);
});

test('a finished timer says so in words, with the step number', () => {
  stepTwo(controlsAt(T0 + 31 * 60_000));
  assert.equal(screen.getByTestId('TimerCard-card').getAttribute('role'), 'alert');
  assert.ok(screen.getByTestId('TimerCard-card').textContent?.includes('Stap 2 klaar'));
  assert.equal(screen.getByTestId('TimerCard-done').textContent, 'Klaar');
});

test('an idle timer is a start button', () => {
  stepTwo(controlsAt(T0, {}));
  assert.equal(screen.getByTestId('TimerChip-start').getAttribute('aria-label'), 'Start timer van 30 min, Deeg rust');
  assert.equal(screen.queryByTestId('TimerCard-card'), null);
});

test('the clock app control is offered only where the clock app can be started', () => {
  const running = controlsAt(T0 + 5 * 60_000);
  stepTwo(running);
  assert.equal(screen.queryByTestId('TimerCard-app'), null);
  cleanup();
  stepTwo({ ...running, clock: { available: true, auto: false, setAuto() {} } });
  assert.match(screen.getByTestId('TimerCard-app').getAttribute('aria-label')!, /klok-app/);
  cleanup();
  // And no setting without it.
  assert.equal(render(<ClockSetting />).container.firstChild, null);
});

test('a handed over timer is a note with the label below it, which can be undone or wiped', () => {
  const timers = handOver({}, defs[0].id, 872_000, T0);
  stepTwo(controlsAt(T0, timers));
  const note = screen.getByTestId('TimerCard-note');
  const restore = screen.getByTestId('TimerCard-restore');
  const wipe = screen.getByTestId('TimerCard-wipe');
  assert.match(note.textContent!, /In je app · 14:32/);
  assert.ok(restore.textContent === 'Herstel' && wipe.textContent === 'Wis');
  assert.match(restore.getAttribute('aria-label')!, /Laat de timer hier verder lopen.*loopt door/);
  assert.match(wipe.getAttribute('aria-label')!, /Wis deze notitie.*loopt door/);
  assert.equal(screen.getByTestId('TimerCard-noteLabel').textContent, 'Deeg rust');
  assert.ok(precedes(note, screen.getByTestId('TimerCard-noteLabel')));
  assert.equal(screen.queryByTestId('TimerCard-stop'), null);
  assert.equal(screen.queryByTestId('TimerCard-add1'), null);
});

// Need layout: the card sits on its own line below the label on a narrow screen, and the chip shows the countdown on a wide one.
test.todo('step-timers › Timer card on a narrow screen');
test.todo('step-timers › Countdown in the chip on a wide screen');

test('with timers always in the app, undoing a hand-over says it runs here', () => {
  const timers = handOver({}, defs[0].id, 872_000, T0);
  stepTwo({ ...controlsAt(T0, timers), clock: { available: true, auto: true, setAuto() {} } });
  assert.equal(screen.getByTestId('TimerCard-restore').textContent, 'Hier laten lopen');
});
