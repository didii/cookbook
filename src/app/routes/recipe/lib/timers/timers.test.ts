import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
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

describe('timerDefs', () => {
  test('ids are the step indexes', () => {
    assert.deepEqual(
      defs.map((d) => d.id),
      ['1', '4', '5', '9', '10'],
    );
  });

  test('a def carries the minutes and label of its step', () => {
    assert.deepEqual([rust.minutes, rust.label], [30, 'Deeg rust']);
  });
});

describe('step-timers › Timer is started', () => {
  test('a timer that was not started is idle', () => {
    assert.equal(timerView({}, rust, T0).state, 'idle');
  });

  test('a started timer runs with the full time left', () => {
    const view = timerView(start({}, rust, T0), rust, T0);
    assert.deepEqual([view.state, view.remainingMs], ['running', 30 * MIN]);
    assert.equal(formatCountdown(view.remainingMs), '30:00');
  });

  test('the time left counts down', () => {
    assert.equal(timerView(start({}, rust, T0), rust, T0 + 5 * MIN).remainingMs, 25 * MIN);
  });
});

describe('step-timers › Time is added', () => {
  const timers = start({}, rust, T0);

  test('one minute added a minute in: the time left is unchanged', () => {
    assert.equal(timerView(add(timers, rust.id, 1, T0 + MIN), rust, T0 + MIN).remainingMs, 30 * MIN);
  });

  test('five minutes added at the start: 35 minutes left', () => {
    assert.equal(timerView(add(timers, rust.id, 5, T0), rust, T0).remainingMs, 35 * MIN);
  });
});

describe('step-timers › Timer is stopped', () => {
  test('is idle again with the full time', () => {
    const timers = stop(start({}, rust, T0), rust.id);
    const view = timerView(timers, rust, T0 + MIN);
    assert.deepEqual([view.state, view.remainingMs], ['idle', 30 * MIN]);
  });
});

describe('step-timers › Timers run side by side', () => {
  const timers = start(start({}, smoren, T0), rust, T0 + 2 * MIN);
  const at = T0 + 5 * MIN;

  test('each timer counts its own time', () => {
    assert.equal(timerView(timers, smoren, at).remainingMs, 15 * MIN);
    assert.equal(timerView(timers, rust, at).remainingMs, 27 * MIN);
  });

  test('stopping one leaves the other alone', () => {
    assert.equal(timerView(stop(timers, rust.id), smoren, at).state, 'running');
  });
});

describe('step-timers › Timer ends', () => {
  const timers = start({}, smoren, T0);
  const end = T0 + 20 * MIN;

  test('a timer one millisecond before its end has not finished', () => {
    assert.deepEqual(newlyFinished(defs, timers, new Set(), end - 1), []);
  });

  test('a timer at its end is newly finished', () => {
    assert.deepEqual(newlyFinished(defs, timers, new Set(), end), [smoren.id]);
  });

  test('a timer already signalled is not signalled again', () => {
    assert.deepEqual(newlyFinished(defs, timers, new Set([smoren.id]), end + 5000), []);
  });

  test('a finished timer has no time left', () => {
    const [finished] = activeTimers(defs, timers, end);
    assert.deepEqual([finished.state, finished.remainingMs], ['finished', 0]);
  });

  test('the page title names the step', () => {
    const [finished] = activeTimers(defs, timers, end);
    assert.equal(finishTitle('Appeltaart', finished.step), '⏰ Stap 5 · Appeltaart');
  });

  test('with nothing finished the title is the original', () => {
    assert.equal(finishTitle('Appeltaart', undefined), 'Appeltaart');
  });
});

describe('step-timers › More time after the end', () => {
  const timers = start({}, smoren, T0);
  const after = T0 + 21 * MIN;

  test('the timer is finished after its end', () => {
    assert.equal(timerView(timers, smoren, after).state, 'finished');
  });

  test('adding time makes it run again with that time', () => {
    const view = timerView(add(timers, smoren.id, 5, after), smoren, after);
    assert.deepEqual([view.state, view.remainingMs], ['running', 5 * MIN]);
  });

  test('it is not newly finished again', () => {
    assert.deepEqual(newlyFinished(defs, add(timers, smoren.id, 5, after), new Set(), after), []);
  });
});

describe('step-timers › Finished timer is dismissed', () => {
  const timers = stop(start({}, smoren, T0), smoren.id);

  test('the timer is idle', () => {
    assert.equal(timerView(timers, smoren, T0 + 30 * MIN).state, 'idle');
  });

  test('it is no longer active', () => {
    assert.deepEqual(activeTimers(defs, timers, T0 + 30 * MIN), []);
  });
});

describe('step-timers › Reload during a timer', () => {
  test('the timer keeps running with the right time left', () => {
    const stored = serialize(start({}, rust, T0));
    const timers = restore(stored, defs);
    const view = timerView(timers, rust, T0 + 10 * MIN);
    assert.deepEqual([view.state, view.remainingMs], ['running', 20 * MIN]);
  });
});

describe('step-timers › Timer ended while away', () => {
  test('the timer is finished', () => {
    const timers = restore(serialize(start({}, rust, T0)), defs);
    assert.equal(timerView(timers, rust, T0 + 45 * MIN).state, 'finished');
  });
});

describe('restore', () => {
  test('ignores nothing stored', () => {
    assert.deepEqual(restore(null, defs), {});
  });

  test('ignores invalid JSON', () => {
    assert.deepEqual(restore('{nope', defs), {});
  });

  test('ignores JSON that is not an object', () => {
    assert.deepEqual(restore('[1]', defs), {});
  });

  test('ignores bad entries and unknown timers', () => {
    assert.deepEqual(restore(JSON.stringify({ '1': { endsAt: 'x' }, '99': { endsAt: 5 }, '4': { endsAt: 7 } }), defs), { '4': { endsAt: 7 } });
  });
});

describe('restore of a stored timer from before the clock app was removed', () => {
  test('a timer with the old field was only a note and is dropped', () => {
    assert.deepEqual(restore(JSON.stringify({ '1': { endsAt: T0, handedOver: 5 } }), defs), {});
  });

  test('a timer without the field is read as before', () => {
    assert.deepEqual(restore(JSON.stringify({ '1': { endsAt: T0 } }), defs), { '1': { endsAt: T0 } });
  });
});

describe('step-timers › Timers follow the order of the steps', () => {
  test('the earlier step comes first although the later was started first', () => {
    const timers = start(start({}, defs[3], T0), rust, T0 + MIN);
    assert.deepEqual(
      activeTimers(defs, timers, T0 + 2 * MIN).map((t) => t.id),
      ['1', '9'],
    );
  });
});

describe('formatCountdown', () => {
  const cases: [number, string][] = [
    [0, '0:00'],
    [999, '0:01'],
    [1000, '0:01'],
    [61_000, '1:01'],
    [14 * MIN + 32_000, '14:32'],
    [3_900_000, '1:05:00'],
  ];
  for (const [ms, text] of cases) {
    test(`${ms} ms is ${text}`, () => {
      assert.equal(formatCountdown(ms), text);
    });
  }
});
