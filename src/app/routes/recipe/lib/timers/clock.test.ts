import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Step } from '~app/shared/recipe';
import { clockAvailable, clockIntentUrl, readClockSetting, writeClockSetting } from './clock';
import { formatCountdown, handOver, restore, serialize, start, startTimer, stop, timerDefs, timerView, undoHandOver } from './timers';

const steps: Step[] = [{ body: 'Laat het deeg rusten.', ingredients: [], timer: { minutes: 30, label: 'Deeg rust' } }];
const defs = timerDefs(steps);
const MIN = 60_000;
const T0 = 1_000_000;

describe('step-timers › Hand over a running timer', () => {
  // 14:32 left: that many seconds go to the clock app, with the label, and the page keeps only a note.
  const left = 14 * MIN + 32_000;
  const url = clockIntentUrl(left / 1000, 'Deeg rust');

  test('the url starts a timer in the clock app', () => {
    assert.ok(url.startsWith('intent:#Intent;action=android.intent.action.SET_TIMER;'));
  });

  test('the url carries the seconds left', () => {
    assert.ok(url.includes('i.android.intent.extra.alarm.LENGTH=872;'));
  });

  test('the url carries the label', () => {
    assert.ok(url.includes('S.android.intent.extra.alarm.MESSAGE=Deeg%20rust;'));
  });

  test('the url skips the clock app screen', () => {
    assert.ok(url.includes('B.android.intent.extra.alarm.SKIP_UI=true;'));
  });

  test('the url ends the intent', () => {
    assert.ok(url.endsWith(';end'));
  });

  test('the page keeps only a note with the time left', () => {
    const view = timerView(handOver({}, defs[0].id, left, T0), defs[0], T0 + 99 * MIN);
    assert.deepEqual([view.state, formatCountdown(view.remainingMs)], ['native', '14:32']);
  });
});

describe('step-timers › Handover is undone', () => {
  const running = start({}, defs[0], T0);
  const handed = handOver(running, defs[0].id, 20 * MIN, T0 + 10 * MIN);

  test('while handed over, the page shows the note and counts nothing', () => {
    // Handed over at 20:00 left.
    assert.equal(timerView(handed, defs[0], T0 + 12 * MIN).state, 'native');
  });

  test('while handed over, the page does not finish the timer', () => {
    assert.equal(timerView(handed, defs[0], T0 + 45 * MIN).state, 'native');
  });

  test('taking it back continues from the original start, not from the hand-over', () => {
    const back = undoHandOver(handed, defs[0].id);
    const view = timerView(back, defs[0], T0 + 12 * MIN);
    assert.deepEqual([view.state, formatCountdown(view.remainingMs)], ['running', '18:00']);
  });

  test('a timer taken back finishes at its original end', () => {
    assert.equal(timerView(undoHandOver(handed, defs[0].id), defs[0], T0 + 31 * MIN).state, 'finished');
  });

  test('it survives a reload while handed over', () => {
    assert.equal(timerView(restore(serialize(handed), defs), defs[0], T0 + 12 * MIN).state, 'native');
  });

  test('wiping the note ends the timer', () => {
    assert.equal(timerView(stop(handed, defs[0].id), defs[0], T0 + 12 * MIN).state, 'idle');
  });

  test('started in the app right away, the undo gives a timer that has run since the start', () => {
    const auto = undoHandOver(startTimer({}, defs[0], T0, true), defs[0].id);
    assert.equal(formatCountdown(timerView(auto, defs[0], T0 + 5 * MIN).remainingMs), '25:00');
  });
});

describe('step-timers › Timers handed over automatically', () => {
  test('a started timer is handed over at once', () => {
    const view = timerView(startTimer({}, defs[0], T0, true), defs[0], T0);
    assert.deepEqual([view.state, formatCountdown(view.remainingMs)], ['native', '30:00']);
  });

  test('without the setting it is an ordinary running timer', () => {
    assert.equal(timerView(startTimer({}, defs[0], T0, false), defs[0], T0).state, 'running');
  });
});

describe('step-timers › Clock app not available', () => {
  test('an Android phone has it', () => {
    assert.equal(clockAvailable({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/140.0 Mobile Safari/537.36' }), true);
  });

  test('an iPhone does not', () => {
    assert.equal(clockAvailable({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1' }), false);
  });

  test('a desktop does not', () => {
    assert.equal(clockAvailable({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0 Safari/537.36' }), false);
  });
});

describe('clock app setting', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };

  test('is off by default', () => {
    assert.equal(readClockSetting(memory()), false);
  });

  test('can be switched on', () => {
    const storage = memory();
    writeClockSetting(true, storage);
    assert.equal(readClockSetting(storage), true);
  });

  test('can be switched off again', () => {
    const storage = memory();
    writeClockSetting(true, storage);
    writeClockSetting(false, storage);
    assert.equal(readClockSetting(storage), false);
  });

  describe('with blocked storage', () => {
    const blocked = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };

    test('reads as off', () => {
      assert.equal(readClockSetting(blocked), false);
    });

    test('writing does not throw', () => {
      assert.doesNotThrow(() => writeClockSetting(true, blocked));
    });
  });
});
