import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '~testing/dom';
import { RowToolbar } from './RowToolbar';

const props = { label: 'Acties', deleteLabel: 'Verwijder', canUp: true, canDown: true, onMove: () => {}, onDelete: () => {} };
const show = (extra: Partial<ComponentProps<typeof RowToolbar>> = {}) => render(<RowToolbar {...props} {...extra} />);
const buttons = () => screen.getAllByTestId<HTMLButtonElement>('RowToolbar-button');
const inTabOrder = () => buttons().filter((b) => b.getAttribute('tabindex') === '0');

describe('RowToolbar without insert', () => {
  test('has three buttons', () => {
    show();
    assert.equal(buttons().length, 3);
  });

  test('has one button in the tab order', () => {
    show();
    assert.equal(inTabOrder().length, 1);
  });

  test('has no insert button', () => {
    show();
    assert.equal(
      buttons().some((b) => b.getAttribute('aria-label')?.startsWith('Voeg')),
      false,
    );
  });
});

describe('RowToolbar with insert', () => {
  const insert = { onInsert: () => {}, insertLabel: 'Voeg toe' };

  test('has four buttons', () => {
    show(insert);
    assert.equal(buttons().length, 4);
  });

  test('has one button in the tab order', () => {
    show(insert);
    assert.equal(inTabOrder().length, 1);
  });

  test('labels the buttons', () => {
    show(insert);
    assert.deepEqual(
      buttons().map((b) => b.getAttribute('aria-label')),
      ['Voeg toe', 'Omhoog', 'Omlaag', 'Verwijder'],
    );
  });

  test('enables the buttons', () => {
    show(insert);
    assert.equal(buttons().filter((b) => b.disabled).length, 0);
  });

  test('is inert when disabled', () => {
    show({ ...insert, disabled: true });
    assert.equal(buttons().filter((b) => b.disabled).length, 4);
  });
});

describe('RowToolbar keyboard', () => {
  // Up cannot be used, so the tab stop is the next button; the arrows skip the disabled one.
  const setup = () => {
    show({ canUp: false });
    const [up, down, remove] = buttons();
    return { up, down, remove, focus: () => down.focus() };
  };

  test('the tab stop is the first enabled button', () => {
    const { down } = setup();
    assert.equal(inTabOrder()[0], down);
  });

  test('ArrowRight moves to the next enabled button', () => {
    const { down, remove, focus } = setup();
    focus();
    fireEvent.keyDown(down, { key: 'ArrowRight' });
    assert.equal(document.activeElement, remove);
  });

  test('ArrowRight wraps round, skipping the disabled button', () => {
    const { down, remove, focus } = setup();
    focus();
    fireEvent.keyDown(down, { key: 'ArrowRight' });
    fireEvent.keyDown(remove, { key: 'ArrowRight' });
    assert.equal(document.activeElement, down);
  });

  test('End jumps to the last button', () => {
    const { down, remove, focus } = setup();
    focus();
    fireEvent.keyDown(down, { key: 'End' });
    assert.equal(document.activeElement, remove);
  });

  test('Home jumps to the first enabled button, not the disabled one', () => {
    const { up, down, remove, focus } = setup();
    focus();
    fireEvent.keyDown(remove, { key: 'Home' });
    assert.equal(document.activeElement, down);
    assert.notEqual(document.activeElement, up);
  });

  test('the button used last is the one in the tab order', () => {
    const { down, focus } = setup();
    focus();
    fireEvent.keyDown(down, { key: 'ArrowRight' });
    assert.equal(inTabOrder()[0], buttons()[2]);
  });
});
