import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appeltaartSteps } from '~testing/steps';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { activeTimers, start, timerDefs, timerView } from '~/lib/timers';
import { StepItem } from './StepItem';
import { TimersContext, type TimerControls } from './timersContext';

const defs = timerDefs(appeltaartSteps);
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
});

const stepTwo = (controls: TimerControls) =>
  renderToStaticMarkup(
    createElement(TimersContext, { value: controls }, createElement(StepItem, { step: appeltaartSteps[1], number: 2, done: false, onToggle() {} })),
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

// Need layout: the card sits on its own line below the label on a narrow screen, and the chip shows the countdown on a wide one.
test.todo('step-timers › Timer card on a narrow screen');
test.todo('step-timers › Countdown in the chip on a wide screen');
