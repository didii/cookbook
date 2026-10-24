import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { clockAvailable, clockIntentUrl, readClockSetting, writeClockSetting } from './clock';

describe('step-timers › Hand over a running timer', () => {
  // 14:32 left: that many seconds go to the clock app, with the label, and the page keeps only a note.
  const left = 872_000;
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
