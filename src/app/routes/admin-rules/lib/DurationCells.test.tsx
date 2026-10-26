import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { DurationCells } from './DurationCells';

const show = (props: Partial<ComponentProps<typeof DurationCells>> = {}) => {
  const calls = { change: [] as object[], step: [] as number[] };
  render(
    <DurationCells
      label="Duur 1"
      minutes="60"
      fixed={false}
      onChange={(patch) => calls.change.push(patch)}
      onStep={(direction) => calls.step.push(direction)}
      {...props}
    />,
  );
  return calls;
};
const minutes = () => screen.getByTestId('DurationCells-minutes') as HTMLInputElement;
const fixed = () => screen.getByTestId('DurationCells-fixed') as HTMLInputElement;

describe('DurationCells', () => {
  test('shows the minutes and "Vast" it was given', () => {
    show({ minutes: '15', fixed: true });
    assert.equal(minutes().value, '15');
    assert.equal(fixed().checked, true);
  });

  test('typing minutes reports them', () => {
    const calls = show();
    fireEvent.change(minutes(), { target: { value: '90' } });
    assert.deepEqual(calls.change, [{ minutes: '90' }]);
  });

  test('checking "Vast" reports it', () => {
    const calls = show();
    fireEvent.click(fixed());
    assert.deepEqual(calls.change, [{ fixed: true }]);
  });

  test('the minutes field is named after the row', () => {
    show();
    assert.ok(minutes().getAttribute('aria-label')?.includes('Duur 1'));
  });
});

describe('DurationCells keys', () => {
  test('Enter asks for the next row and does not submit', () => {
    const calls = show();
    assert.equal(fireEvent.keyDown(minutes(), { key: 'Enter' }), false);
    assert.deepEqual(calls.step, [1]);
  });

  test('ArrowDown asks for the next row', () => {
    const calls = show();
    fireEvent.keyDown(minutes(), { key: 'ArrowDown' });
    assert.deepEqual(calls.step, [1]);
  });

  test('ArrowUp asks for the previous row', () => {
    const calls = show();
    fireEvent.keyDown(minutes(), { key: 'ArrowUp' });
    assert.deepEqual(calls.step, [-1]);
  });
});
