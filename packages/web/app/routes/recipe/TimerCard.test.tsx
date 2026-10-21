import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanup, precedes, render, screen } from '~testing/dom';
import type { Step } from '~/lib/recipe';
import { activeTimers, handOver, start, timerDefs, timerView } from '~/lib/timers';
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
  assert.ok(screen.getByRole('group'));
  assert.ok(screen.getAllByText('25:00').length >= 1);
  assert.ok(screen.getByRole('button', { name: 'Eén minuut erbij' }) && screen.getByRole('button', { name: 'Vijf minuten erbij' }));
  assert.ok(screen.getByRole('button', { name: /Stop/ }));
  assert.ok(screen.getByRole('timer'));
  // The start button is gone while it runs.
  assert.equal(screen.queryByLabelText(/Start timer van/), null);
});

test('a finished timer says so in words, with the step number', () => {
  stepTwo(controlsAt(T0 + 31 * 60_000));
  assert.ok(screen.getByRole('alert').textContent?.includes('Stap 2 klaar'));
  assert.ok(screen.getByRole('button', { name: 'Klaar' }));
});

test('an idle timer is a start button', () => {
  stepTwo(controlsAt(T0, {}));
  assert.ok(screen.getByRole('button', { name: 'Start timer van 30 min, Deeg rust' }));
  assert.equal(screen.queryByRole('group'), null);
});

test('the clock app control is offered only where the clock app can be started', () => {
  const running = controlsAt(T0 + 5 * 60_000);
  stepTwo(running);
  assert.equal(screen.queryByRole('button', { name: /klok-app/ }), null);
  cleanup();
  stepTwo({ ...running, clock: { available: true, auto: false, setAuto() {} } });
  assert.ok(screen.getByRole('button', { name: /klok-app/ }));
  cleanup();
  // And no setting without it.
  assert.equal(render(<ClockSetting />).container.firstChild, null);
});

test('a handed over timer is a note with the label below it, which can be undone or wiped', () => {
  const timers = handOver({}, defs[0].id, 872_000, T0);
  stepTwo(controlsAt(T0, timers));
  const note = screen.getByText(/In je app · 14:32/);
  assert.ok(
    screen.getByRole('button', { name: /Laat de timer hier verder lopen/ }).textContent === 'Herstel' &&
      screen.getByRole('button', { name: /Wis deze notitie/ }).textContent === 'Wis' &&
      screen.getAllByRole('button', { name: /loopt door/ }).length === 2,
  );
  assert.ok(precedes(note, screen.getAllByText('Deeg rust')[0]));
  assert.equal(screen.queryByRole('button', { name: /Stop/ }), null);
  assert.equal(screen.queryByText('+1'), null);
});

// Need layout: the card sits on its own line below the label on a narrow screen, and the chip shows the countdown on a wide one.
test.todo('step-timers › Timer card on a narrow screen');
test.todo('step-timers › Countdown in the chip on a wide screen');

test('with timers always in the app, undoing a hand-over says it runs here', () => {
  const timers = handOver({}, defs[0].id, 872_000, T0);
  stepTwo({ ...controlsAt(T0, timers), clock: { available: true, auto: true, setAuto() {} } });
  assert.ok(screen.getByRole('button', { name: /Laat de timer hier verder lopen/ }).textContent === 'Hier laten lopen');
  assert.equal(screen.queryByText('Herstel'), null);
});
