import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Step } from './recipes';
import { signalEnd } from './signal';
import { activeTimers, add, finishTitle, formatCountdown, newlyFinished, restore, serialize, start, stop, timerDefs, timerView } from './timers';

// Eleven steps; the ones with a timer are 2, 5, 6, 10 and 11.
const timerAt: Record<number, { minutes: number; label: string }> = {
  1: { minutes: 30, label: 'Deeg rust' },
  4: { minutes: 20, label: 'Appels smoren' },
  5: { minutes: 10, label: 'Uitlekken' },
  9: { minutes: 50, label: 'Bakken' },
  10: { minutes: 45, label: 'Afkoelen' },
};
const steps: Step[] = Array.from({ length: 11 }, (_, i) => ({ body: `stap ${i + 1}`, ingredients: [], timer: timerAt[i] }));
const defs = timerDefs(steps);
const rust = defs[0]; // step 2, 30 minutes
const smoren = defs[1]; // step 5, 20 minutes
const MIN = 60_000;
const T0 = 1_000_000;

test('timerDefs: ids are the step indexes', () => {
  assert.deepEqual(
    defs.map((d) => d.id),
    ['1', '4', '5', '9', '10'],
  );
  assert.deepEqual([rust.minutes, rust.label], [30, 'Deeg rust']);
});

test('step-timers › Timer is started', () => {
  assert.equal(timerView({}, rust, T0).state, 'idle');
  const timers = start({}, rust, T0);
  const view = timerView(timers, rust, T0);
  assert.deepEqual([view.state, view.remainingMs], ['running', 30 * MIN]);
  assert.equal(formatCountdown(view.remainingMs), '30:00');
  assert.equal(timerView(timers, rust, T0 + 5 * MIN).remainingMs, 25 * MIN);
});

test('step-timers › Time is added', () => {
  const timers = start({}, rust, T0);
  assert.equal(timerView(add(timers, rust.id, 1, T0 + MIN), rust, T0 + MIN).remainingMs, 30 * MIN);
  assert.equal(timerView(add(timers, rust.id, 5, T0), rust, T0).remainingMs, 35 * MIN);
});

test('step-timers › Timer is stopped', () => {
  const timers = stop(start({}, rust, T0), rust.id);
  const view = timerView(timers, rust, T0 + MIN);
  assert.deepEqual([view.state, view.remainingMs], ['idle', 30 * MIN]);
});

test('step-timers › Timers run side by side', () => {
  const timers = start(start({}, smoren, T0), rust, T0 + 2 * MIN);
  const at = T0 + 5 * MIN;
  assert.equal(timerView(timers, smoren, at).remainingMs, 15 * MIN);
  assert.equal(timerView(timers, rust, at).remainingMs, 27 * MIN);
  // Stopping one leaves the other alone.
  assert.equal(timerView(stop(timers, rust.id), smoren, at).state, 'running');
});

test('step-timers › Timer ends', () => {
  const timers = start({}, smoren, T0);
  const end = T0 + 20 * MIN;
  assert.deepEqual(newlyFinished(defs, timers, new Set(), end - 1), []);
  assert.deepEqual(newlyFinished(defs, timers, new Set(), end), [smoren.id]);
  // Already signalled: not again.
  assert.deepEqual(newlyFinished(defs, timers, new Set([smoren.id]), end + 5000), []);
  const [finished] = activeTimers(defs, timers, end);
  assert.deepEqual([finished.state, finished.remainingMs], ['finished', 0]);
  // The page title names the step; with nothing finished it is the original.
  assert.equal(finishTitle('Appeltaart', finished.step), '⏰ Stap 5 · Appeltaart');
  assert.equal(finishTitle('Appeltaart', undefined), 'Appeltaart');
  // Sound and vibration, stubbed.
  const calls: unknown[] = [];
  const nodes = { connect() {}, frequency: {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, start() {}, stop() {} };
  const audio = { currentTime: 0, destination: {}, createOscillator: () => (calls.push('osc'), nodes) as never, createGain: () => nodes as never };
  signalEnd(audio as unknown as AudioContext, { vibrate: (p) => (calls.push(p), true) });
  assert.deepEqual(calls.at(-1), [200, 100, 200]);
  assert.equal(calls.filter((c) => c === 'osc').length, 3);
  // Without audio or vibration support nothing throws.
  signalEnd(undefined, {} as Navigator);
});

test('step-timers › More time after the end', () => {
  const timers = start({}, smoren, T0);
  const after = T0 + 21 * MIN;
  assert.equal(timerView(timers, smoren, after).state, 'finished');
  const more = add(timers, smoren.id, 5, after);
  const view = timerView(more, smoren, after);
  assert.deepEqual([view.state, view.remainingMs], ['running', 5 * MIN]);
  assert.deepEqual(newlyFinished(defs, more, new Set(), after), []);
});

test('step-timers › Finished timer is dismissed', () => {
  const timers = stop(start({}, smoren, T0), smoren.id);
  assert.equal(timerView(timers, smoren, T0 + 30 * MIN).state, 'idle');
  assert.deepEqual(activeTimers(defs, timers, T0 + 30 * MIN), []);
});

test('step-timers › Reload during a timer', () => {
  const stored = serialize(start({}, rust, T0));
  const timers = restore(stored, defs);
  const view = timerView(timers, rust, T0 + 10 * MIN);
  assert.deepEqual([view.state, view.remainingMs], ['running', 20 * MIN]);
});

test('step-timers › Timer ended while away', () => {
  const timers = restore(serialize(start({}, rust, T0)), defs);
  assert.equal(timerView(timers, rust, T0 + 45 * MIN).state, 'finished');
});

test('restore ignores what it cannot read or does not know', () => {
  assert.deepEqual(restore(null, defs), {});
  assert.deepEqual(restore('{nope', defs), {});
  assert.deepEqual(restore('[1]', defs), {});
  assert.deepEqual(restore(JSON.stringify({ '1': { endsAt: 'x' }, '99': { endsAt: 5 }, '4': { endsAt: 7 } }), defs), { '4': { endsAt: 7 } });
});

test('step-timers › Timers follow the order of the steps', () => {
  // The later step is started first.
  const timers = start(start({}, defs[3], T0), rust, T0 + MIN);
  assert.deepEqual(
    activeTimers(defs, timers, T0 + 2 * MIN).map((t) => t.id),
    ['1', '9'],
  );
});

test('formatCountdown', () => {
  assert.deepEqual([0, 999, 1000, 61_000, 14 * MIN + 32_000, 3_900_000].map(formatCountdown), ['0:00', '0:01', '0:01', '1:01', '14:32', '1:05:00']);
});
