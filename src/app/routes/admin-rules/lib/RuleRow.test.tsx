import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { RuleRow } from './RuleRow';

const show = (props: Partial<ComponentProps<typeof RuleRow>> = {}) => {
  const calls: string[] = [];
  render(
    <ul>
      <RuleRow
        label="Eenheid 2"
        rowId="row"
        text="kg"
        free={false}
        canUp
        canDown
        gripProps={{}}
        onType={(text) => calls.push(`type ${text}`)}
        onRemove={() => calls.push('remove')}
        onMove={(direction) => calls.push(`move ${direction}`)}
        onStep={(direction) => calls.push(`step ${direction}`)}
        onBackspaceEmpty={() => calls.push('backspace')}
        {...props}
      />
    </ul>,
  );
  return calls;
};
const field = () => screen.getByTestId('RuleRow-field') as HTMLInputElement;
const press = (key: string, init: object = {}) => fireEvent.keyDown(field(), { key, ...init });

describe('RuleRow keys', () => {
  test('Enter asks for the next row and does not submit', () => {
    const calls = show();
    assert.equal(fireEvent.keyDown(field(), { key: 'Enter' }), false);
    assert.deepEqual(calls, ['step 1']);
  });

  test('ArrowDown asks for the next row', () => {
    const calls = show();
    press('ArrowDown');
    assert.deepEqual(calls, ['step 1']);
  });

  test('ArrowUp asks for the previous row', () => {
    const calls = show();
    press('ArrowUp');
    assert.deepEqual(calls, ['step -1']);
  });

  test('Alt+ArrowUp moves the row up', () => {
    const calls = show();
    press('ArrowUp', { altKey: true });
    assert.deepEqual(calls, ['move -1']);
  });

  test('Alt+ArrowDown moves the row down', () => {
    const calls = show();
    press('ArrowDown', { altKey: true });
    assert.deepEqual(calls, ['move 1']);
  });

  test('Alt+ArrowUp does nothing when the row cannot go up', () => {
    const calls = show({ canUp: false });
    press('ArrowUp', { altKey: true });
    assert.deepEqual(calls, []);
  });

  test('Alt+ArrowDown does nothing when the row cannot go down', () => {
    const calls = show({ canDown: false });
    press('ArrowDown', { altKey: true });
    assert.deepEqual(calls, []);
  });

  test('Backspace in an empty field asks to remove the row', () => {
    const calls = show({ text: '' });
    press('Backspace');
    assert.deepEqual(calls, ['backspace']);
  });

  test('Backspace in a field with text is left alone', () => {
    const calls = show();
    press('Backspace');
    assert.deepEqual(calls, []);
  });

  test('Backspace in the empty row at the end is left alone', () => {
    const calls = show({ text: '', free: true });
    press('Backspace');
    assert.deepEqual(calls, []);
  });
});

describe('RuleRow field', () => {
  test('typing reports the text', () => {
    const calls = show();
    fireEvent.change(field(), { target: { value: 'kgs' } });
    assert.deepEqual(calls, ['type kgs']);
  });

  test('the field is named by the label', () => {
    show();
    assert.equal(field().getAttribute('aria-label'), 'Eenheid 2');
  });

  test('the placeholder is shown', () => {
    show({ placeholder: 'bv. kopje' });
    assert.equal(field().placeholder, 'bv. kopje');
  });
});

describe('RuleRow cross', () => {
  test('pressing the cross asks to remove the row', () => {
    const calls = show();
    fireEvent.click(screen.getByTestId('RuleRow-remove'));
    assert.deepEqual(calls, ['remove']);
  });
});

describe('RuleRow error', () => {
  test('without an error the field is valid and no message is shown', () => {
    show();
    assert.equal(field().getAttribute('aria-invalid'), null);
    assert.equal(screen.queryByTestId('RuleRow-error'), null);
  });

  test('the message is shown and the field points to it', () => {
    show({ error: 'Fout' });
    assert.equal(field().getAttribute('aria-invalid'), 'true');
    assert.equal(field().getAttribute('aria-describedby'), screen.getByTestId('RuleRow-error').id);
  });
});
