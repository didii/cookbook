import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Step } from '~/lib/recipes';
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
  renderToStaticMarkup(
    createElement(TimersContext, { value: controls }, createElement(StepItem, { step: steps[1], number: 2, done: false, onToggle() {} })),
  );

test('a running timer is a card with its controls and a countdown chip', () => {
  const html = stepTwo(controlsAt(T0 + 5 * 60_000));
  assert.ok(html.includes('role="group"') && html.includes('25:00'));
  assert.ok(html.includes('aria-label="Eén minuut erbij"') && html.includes('aria-label="Vijf minuten erbij"') && html.includes('>Stop<'));
  assert.ok(html.includes('role="timer"'));
  // The start button is gone while it runs.
  assert.ok(!html.includes('Start timer van'));
});

test('a finished timer says so in words, with the step number', () => {
  const html = stepTwo(controlsAt(T0 + 31 * 60_000));
  assert.ok(html.includes('role="alert"') && html.includes('Stap 2 klaar') && html.includes('>Klaar<'));
});

test('an idle timer is a start button', () => {
  const html = stepTwo(controlsAt(T0, {}));
  assert.ok(html.includes('aria-label="Start timer van 30 min, Deeg rust"'));
  assert.ok(!html.includes('role="group"'));
});

test('the clock app control is offered only where the clock app can be started', () => {
  const running = controlsAt(T0 + 5 * 60_000);
  assert.ok(!stepTwo(running).includes('>App<'));
  assert.ok(stepTwo({ ...running, clock: { available: true, auto: false, setAuto() {} } }).includes('>App<'));
  // And no setting without it.
  assert.equal(renderToStaticMarkup(createElement(ClockSetting)), '');
});

test('a handed over timer is a note with the label below it, which can be undone or wiped', () => {
  const timers = handOver({}, defs[0].id, 872_000, T0);
  const html = stepTwo(controlsAt(T0, timers));
  assert.ok(html.includes('In je app · 14:32') && html.includes('>Herstel<') && html.includes('>Wis<') && html.includes('loopt door'));
  assert.ok(html.indexOf('In je app') < html.indexOf('Deeg rust'));
  assert.ok(!html.includes('>Stop<') && !html.includes('>+1<'));
});

// Need layout: the card sits on its own line below the label on a narrow screen, and the chip shows the countdown on a wide one.
test.todo('step-timers › Timer card on a narrow screen');
test.todo('step-timers › Countdown in the chip on a wide screen');

test('with timers always in the app, undoing a hand-over says it runs here', () => {
  const timers = handOver({}, defs[0].id, 872_000, T0);
  const html = stepTwo({ ...controlsAt(T0, timers), clock: { available: true, auto: true, setAuto() {} } });
  assert.ok(html.includes('>Hier laten lopen<') && !html.includes('>Herstel<'));
});
