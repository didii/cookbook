import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanup, fireEvent, render, screen } from '~testing/dom';
import { createElement } from 'react';
import { RowToolbar } from './RowToolbar';

const props = { label: 'Acties', deleteLabel: 'Verwijder', canUp: true, canDown: true, onMove: () => {}, onDelete: () => {} };
const show = (extra: object = {}) => render(createElement(RowToolbar, { ...props, ...extra }));
const inTabOrder = () => screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0');

test('a toolbar without insert has three buttons, one in the tab order', () => {
  show();
  assert.equal(screen.getAllByRole('button').length, 3);
  assert.equal(inTabOrder().length, 1);
  assert.equal(screen.queryByRole('button', { name: /Voeg/ }), null);
});

test('a toolbar with insert has four buttons, one in the tab order, inert when disabled', () => {
  const insert = { onInsert: () => {}, insertLabel: 'Voeg toe' };
  show(insert);
  assert.equal(screen.getAllByRole('button').length, 4);
  assert.equal(inTabOrder().length, 1);
  assert.deepEqual(
    screen.getAllByRole('button').map((b) => b.getAttribute('aria-label')),
    ['Voeg toe', 'Omhoog', 'Omlaag', 'Verwijder'],
  );
  assert.equal(screen.getAllByRole<HTMLButtonElement>('button').filter((b) => b.disabled).length, 0);
  cleanup();
  show({ ...insert, disabled: true });
  assert.equal(screen.getAllByRole<HTMLButtonElement>('button').filter((b) => b.disabled).length, 4);
});

test('the arrow keys move between the enabled buttons, and Home and End jump to the ends', () => {
  show({ canUp: false });
  const [up, down, remove] = screen.getAllByRole('button');
  // Up cannot be used, so the tab stop is the next button; the arrows skip the disabled one.
  assert.equal(inTabOrder()[0], down);
  down.focus();
  fireEvent.keyDown(down, { key: 'ArrowRight' });
  assert.equal(document.activeElement, remove);
  fireEvent.keyDown(remove, { key: 'ArrowRight' });
  assert.equal(document.activeElement, down);
  fireEvent.keyDown(down, { key: 'End' });
  assert.equal(document.activeElement, remove);
  fireEvent.keyDown(remove, { key: 'Home' });
  assert.equal(document.activeElement, down);
  assert.notEqual(document.activeElement, up);
  // The button used last is the one in the tab order.
  assert.equal(inTabOrder()[0], down);
});
