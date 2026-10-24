import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { TimerChip } from './TimerChip';
import type { TimerView } from './timers';
import { TimersContext, type TimerControls } from './timersContext';

const timer = { id: '1', step: 1, minutes: 30, label: 'Deeg rust' };

const chip = (view?: TimerView) => {
  const controls: TimerControls = {
    active: view ? [view] : [],
    view: () => view,
    start() {},
    add() {},
    stop() {},
    handOver() {},
    undoHandOver() {},
    clock: { available: false, auto: false, setAuto() {} },
  };
  return render(
    <TimersContext value={controls}>
      <ul>
        <TimerChip id="1" minutes={30} label="Deeg rust" />
      </ul>
    </TimersContext>,
  );
};

describe('TimerChip idle timer', () => {
  test('is a labelled start button', () => {
    chip({ ...timer, state: 'idle', remainingMs: 30 * 60_000 });
    assert.equal(screen.getByTestId('TimerChip-start').getAttribute('aria-label'), 'Start timer van 30 min, Deeg rust');
  });
});

describe('TimerChip running timer', () => {
  const running: TimerView = { ...timer, state: 'running', remainingMs: 25 * 60_000 };

  test('has a countdown chip', () => {
    chip(running);
    assert.equal(screen.getByTestId('TimerChip-countdown').getAttribute('role'), 'timer');
    assert.equal(screen.getByTestId('TimerChip-countdown').textContent, '25:00');
  });

  test('has no start button', () => {
    chip(running);
    assert.equal(screen.queryByTestId('TimerChip-start'), null);
  });
});

describe('TimerChip handed over timer', () => {
  test('shows nothing', () => {
    chip({ ...timer, state: 'native', remainingMs: 872_000 });
    assert.equal(screen.queryByTestId('TimerChip-countdown'), null);
    assert.equal(screen.queryByTestId('TimerChip-start'), null);
  });
});
