import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { NoteCue } from './NoteCue';

describe('NoteCue', () => {
  test('keeps the live region when the cue is off', () => {
    render(<NoteCue cue="off" onClear={() => {}} onEnd={() => {}} />);
    assert.ok(screen.getByTestId('NoteCue-status'));
  });

  test('shows no cue when off', () => {
    render(<NoteCue cue="off" onClear={() => {}} onEnd={() => {}} />);
    assert.equal(screen.queryByTestId('NoteCue-cue'), null);
  });

  test('shows the cue inside the live region when shown', () => {
    render(<NoteCue cue="shown" onClear={() => {}} onEnd={() => {}} />);
    assert.ok(screen.getByTestId('NoteCue-status').contains(screen.getByTestId('NoteCue-cue')));
  });

  test('shows the cue while fading', () => {
    render(<NoteCue cue="fading" onClear={() => {}} onEnd={() => {}} />);
    assert.ok(screen.getByTestId('NoteCue-cue'));
  });

  test('a tap calls onClear', () => {
    let cleared = 0;
    render(<NoteCue cue="shown" onClear={() => cleared++} onEnd={() => {}} />);
    fireEvent.click(screen.getByTestId('NoteCue-cue'));
    assert.equal(cleared, 1);
  });

  test('the end of the animation calls onEnd', () => {
    let ended = 0;
    render(<NoteCue cue="fading" onClear={() => {}} onEnd={() => ended++} />);
    fireEvent.animationEnd(screen.getByTestId('NoteCue-cue'));
    assert.equal(ended, 1);
  });
});
