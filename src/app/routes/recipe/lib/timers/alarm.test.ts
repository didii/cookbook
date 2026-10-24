import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fake } from '~testing/fake';
import { soundAlarm } from './alarm';

describe('soundAlarm', () => {
  const run = () => {
    const calls: unknown[] = [];
    const nodes = { connect() {}, frequency: {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, start() {}, stop() {} };
    const audio = {
      currentTime: 0,
      destination: {},
      createOscillator: () => (calls.push('osc'), nodes) as never,
      createGain: () => nodes as never,
    };
    soundAlarm(fake<AudioContext>(audio), { vibrate: (p) => (calls.push(p), true) });
    return calls;
  };

  test('beeps three times', () => {
    assert.equal(run().filter((c) => c === 'osc').length, 3);
  });

  test('vibrates 200, 100, 200', () => {
    assert.deepEqual(run().at(-1), [200, 100, 200]);
  });

  test('without audio or vibration support nothing throws', () => {
    soundAlarm(undefined, {} as Navigator);
  });
});
