import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cssFor } from '~testing/css';
import { fireEvent, precedes, render, screen, within } from '~testing/dom';
import { useState } from 'react';
import type { IngredientLine } from '~/lib/draft';
import { IngredientList } from './IngredientList';

/** The list as the editor holds it: a few rows and the free row at the end. */
function Harness({ start }: { start: string[] }) {
  const [rows, setRows] = useState<IngredientLine[]>([...start, ''].map((text, i) => ({ id: `r${i}`, text })));
  return (
    <IngredientList
      rows={rows}
      onType={(id, text) => setRows((r) => r.map((x) => (x.id === id ? { ...x, text } : x)))}
      onRemove={(id) => setRows((r) => r.filter((x) => x.id !== id))}
      onMove={(id, to) =>
        setRows((r) => {
          const next = [...r];
          next.splice(
            to,
            0,
            ...next.splice(
              r.findIndex((x) => x.id === id),
              1,
            ),
          );
          return next;
        })
      }
    />
  );
}

const show = (...start: string[]) => render(<Harness start={start} />);
const fields = () => screen.getAllByTestId<HTMLInputElement>('IngredientItem-field');
const field = (n: number) => fields()[n - 1];
const toolbar = (n: number) => screen.getAllByTestId('RowToolbar-toolbar')[n - 1];
const buttonsOf = (n: number) => within(toolbar(n)).getAllByTestId<HTMLButtonElement>('RowToolbar-button');
const press = (el: Element, key: string, init: object = {}) => fireEvent.keyDown(el, { key, ...init });

test('recipe-ingredient-editing › Quantity is highlighted while typing', async () => {
  show();
  fireEvent.change(field(1), { target: { value: '250 g bloem' } });
  // The field's own text is transparent; a layer under it paints the same text with the quantity in blue.
  const quantity = screen.getByTestId('IngredientItem-quantity');
  assert.equal(quantity.tagName, 'B');
  assert.equal(field(1).getAttribute('aria-label'), 'Ingrediënt 1');
  assert.equal(toolbar(1).getAttribute('aria-label'), 'Acties voor ingrediënt 1');
  assert.equal(quantity.textContent, '250 g');
  assert.equal(quantity.parentElement?.textContent, '250 g bloem');
  assert.match(await cssFor(quantity.className), /color: var\(--color-blu\)/);
  assert.match(await cssFor(field(1).className), /color: transparent/);
  // Without a quantity, nothing is highlighted.
  fireEvent.change(field(1), { target: { value: 'bruine suiker' } });
  assert.equal(screen.queryByTestId('IngredientItem-quantity'), null);
  assert.equal(document.querySelector('b'), null);
});

test('recipe-ingredient-editing › Enter moves to the next row', () => {
  show('250 g bloem', '2 eieren');
  field(1).focus();
  press(field(1), 'Enter');
  assert.ok(document.activeElement === field(2), 'focus');
  // From the last filled row it is the empty row.
  press(field(2), 'Enter');
  assert.ok(document.activeElement === field(3), 'focus');
  assert.equal(field(3).value, '');
});

test('recipe-ingredient-editing › Arrow keys move between rows', () => {
  show('250 g bloem', '2 eieren');
  field(1).focus();
  // Nothing happens above the first row.
  press(field(1), 'ArrowUp');
  assert.ok(document.activeElement === field(1), 'focus');
  press(field(1), 'ArrowDown');
  assert.ok(document.activeElement === field(2), 'focus');
  press(field(2), 'ArrowDown');
  assert.ok(document.activeElement === field(3), 'focus');
  // Nor below the last.
  press(field(3), 'ArrowDown');
  assert.ok(document.activeElement === field(3), 'focus');
  press(field(3), 'ArrowUp');
  assert.ok(document.activeElement === field(2), 'focus');
});

test('recipe-ingredient-editing › Backspace removes an empty row', () => {
  show('250 g bloem', '', '2 eieren');
  assert.equal(fields().length, 4);
  field(2).focus();
  press(field(2), 'Backspace');
  assert.equal(fields().length, 3);
  assert.deepEqual(
    fields().map((f) => f.value),
    ['250 g bloem', '2 eieren', ''],
  );
  // Focus is at the end of the row above.
  assert.ok(document.activeElement === field(1), 'focus');
  assert.equal(field(1).selectionStart, '250 g bloem'.length);
  // The last row is not removed, and neither is a row with text.
  press(field(3), 'Backspace');
  press(field(2), 'Backspace');
  assert.equal(fields().length, 3);
});

test('recipe-ingredient-editing › Edge rows cannot move out of the list', () => {
  show('250 g bloem', '2 eieren', 'zout');
  const disabled = (n: number) => Object.fromEntries(buttonsOf(n).map((b) => [b.getAttribute('aria-label'), b.disabled]));
  // The first row cannot go up, the last filled row cannot go down; in between both work.
  assert.equal(disabled(1)['Omhoog'], true);
  assert.equal(disabled(1)['Omlaag'], false);
  assert.equal(disabled(2)['Omhoog'], false);
  assert.equal(disabled(2)['Omlaag'], false);
  assert.equal(disabled(3)['Omhoog'], false);
  assert.equal(disabled(3)['Omlaag'], true);
});

test('recipe-ingredient-editing › Row buttons are one tab stop', () => {
  show('250 g bloem', '2 eieren', 'zout');
  for (const n of [1, 2, 3]) {
    // The group comes before the field, has one button in the tab order, and the field is in the tab order after it.
    const stops = buttonsOf(n).filter((b) => b.getAttribute('tabindex') === '0');
    assert.equal(stops.length, 1);
    assert.ok(precedes(toolbar(n), field(n)));
    assert.notEqual(field(n).getAttribute('tabindex'), '-1');
  }
  // The arrow keys move between the buttons of the group.
  const [up, down] = buttonsOf(2);
  up.focus();
  press(up, 'ArrowRight');
  assert.ok(document.activeElement === down, 'focus');
});

test('recipe-ingredient-editing › Alt and arrow move the row', () => {
  show('250 g bloem', '2 eieren', 'zout');
  field(1).focus();
  field(1).setSelectionRange(3, 3);
  press(field(1), 'ArrowDown', { altKey: true });
  assert.deepEqual(
    fields().map((f) => f.value),
    ['2 eieren', '250 g bloem', 'zout', ''],
  );
  // Focus stays in the field of the moved row, with the cursor where it was.
  assert.ok(document.activeElement === field(2), 'focus');
  assert.equal(field(2).selectionStart, 3);
  press(field(2), 'ArrowUp', { altKey: true });
  assert.equal(field(1).value, '250 g bloem');
  assert.ok(document.activeElement === field(1), 'focus');
  // At the edges nothing moves.
  press(field(1), 'ArrowUp', { altKey: true });
  assert.equal(field(1).value, '250 g bloem');
});

test('recipe-ingredient-editing › Move is announced', () => {
  show('250 g bloem', '2 eieren', 'zout');
  const live = screen.getByTestId('Announcement-live');
  assert.equal(live.getAttribute('aria-live'), 'polite');
  assert.equal(live.textContent, '');
  // The buttons of a row are up, down and delete.
  fireEvent.click(buttonsOf(1)[1]);
  assert.equal(live.textContent, "Ingrediënt '250 g bloem' staat nu op plaats 2 van 3");
  press(field(2), 'ArrowDown', { altKey: true });
  assert.equal(live.textContent, "Ingrediënt '250 g bloem' staat nu op plaats 3 van 3");
});
