import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { cssFor } from '~testing/css';
import { fireEvent, precedes, render, screen, within } from '~testing/dom';
import type { IngredientLine } from './IngredientList';
import { IngredientList } from './IngredientList';

/** The list as the editor holds it: a few rows and the free row at the end. */
function Harness({ start }: { start: string[] }) {
  const [rows, setRows] = useState<IngredientLine[]>([...start, ''].map((text, i) => ({ id: `r${i}`, text })));
  return (
    <IngredientList
      rows={rows}
      rules={defaultRules}
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

describe('recipe-ingredient-editing › Quantity is highlighted while typing', () => {
  const typed = () => {
    show();
    fireEvent.change(field(1), { target: { value: '250 g bloem' } });
    return screen.getByTestId('IngredientItem-quantity');
  };

  // The field's own text is transparent; a layer under it paints the same text with the quantity in blue.
  test('the quantity is marked up as bold', () => {
    assert.equal(typed().tagName, 'B');
  });

  test('the field is named after its row', () => {
    typed();
    assert.equal(field(1).getAttribute('aria-label'), 'Ingrediënt 1');
  });

  test('the toolbar is named after its row', () => {
    typed();
    assert.equal(toolbar(1).getAttribute('aria-label'), 'Acties voor ingrediënt 1');
  });

  test('only the quantity is highlighted', () => {
    assert.equal(typed().textContent, '250 g');
  });

  test('the layer repeats the whole text', () => {
    assert.equal(typed().parentElement?.textContent, '250 g bloem');
  });

  test('the quantity is blue', async () => {
    assert.match(await cssFor(typed().className), /color: var\(--color-blu\)/);
  });

  test('the field text is transparent', async () => {
    typed();
    assert.match(await cssFor(field(1).className), /color: transparent/);
  });

  // Without a quantity, nothing is highlighted.
  test('no quantity is highlighted without a quantity', () => {
    typed();
    fireEvent.change(field(1), { target: { value: 'bruine suiker' } });
    assert.equal(screen.queryByTestId('IngredientItem-quantity'), null);
  });

  test('no highlight element is left without a quantity', () => {
    typed();
    fireEvent.change(field(1), { target: { value: 'bruine suiker' } });
    assert.equal(document.querySelector('b'), null);
  });
});

describe('recipe-ingredient-editing › Enter moves to the next row', () => {
  test('Enter focuses the next row', () => {
    show('250 g bloem', '2 eieren');
    field(1).focus();
    press(field(1), 'Enter');
    assert.ok(document.activeElement === field(2));
  });

  // From the last filled row it is the empty row.
  test('Enter on the last filled row focuses the empty row', () => {
    show('250 g bloem', '2 eieren');
    field(2).focus();
    press(field(2), 'Enter');
    assert.ok(document.activeElement === field(3));
    assert.equal(field(3).value, '');
  });
});

describe('recipe-ingredient-editing › Arrow keys move between rows', () => {
  const setup = () => {
    show('250 g bloem', '2 eieren');
  };

  // Nothing happens above the first row.
  test('ArrowUp on the first row stays', () => {
    setup();
    field(1).focus();
    press(field(1), 'ArrowUp');
    assert.ok(document.activeElement === field(1));
  });

  test('ArrowDown moves to the next row', () => {
    setup();
    field(1).focus();
    press(field(1), 'ArrowDown');
    assert.ok(document.activeElement === field(2));
  });

  test('ArrowDown moves to the empty row', () => {
    setup();
    field(2).focus();
    press(field(2), 'ArrowDown');
    assert.ok(document.activeElement === field(3));
  });

  // Nor below the last.
  test('ArrowDown on the last row stays', () => {
    setup();
    field(3).focus();
    press(field(3), 'ArrowDown');
    assert.ok(document.activeElement === field(3));
  });

  test('ArrowUp moves to the previous row', () => {
    setup();
    field(3).focus();
    press(field(3), 'ArrowUp');
    assert.ok(document.activeElement === field(2));
  });
});

describe('recipe-ingredient-editing › Backspace removes an empty row', () => {
  const setup = () => {
    show('250 g bloem', '', '2 eieren');
    field(2).focus();
  };

  test('there are four rows to begin with', () => {
    setup();
    assert.equal(fields().length, 4);
  });

  test('Backspace removes the empty row', () => {
    setup();
    press(field(2), 'Backspace');
    assert.deepEqual(
      fields().map((f) => f.value),
      ['250 g bloem', '2 eieren', ''],
    );
  });

  // Focus is at the end of the row above.
  test('focus moves to the row above', () => {
    setup();
    press(field(2), 'Backspace');
    assert.ok(document.activeElement === field(1));
  });

  test('the cursor is at the end of the row above', () => {
    setup();
    press(field(2), 'Backspace');
    assert.equal(field(1).selectionStart, '250 g bloem'.length);
  });

  // The last row is not removed, and neither is a row with text.
  test('the last row is not removed', () => {
    setup();
    press(field(2), 'Backspace');
    press(field(3), 'Backspace');
    assert.equal(fields().length, 3);
  });

  test('a row with text is not removed', () => {
    setup();
    press(field(2), 'Backspace');
    press(field(2), 'Backspace');
    assert.equal(fields().length, 3);
  });
});

describe('recipe-ingredient-editing › Edge rows cannot move out of the list', () => {
  const disabled = (n: number) => Object.fromEntries(buttonsOf(n).map((b) => [b.getAttribute('aria-label'), b.disabled]));
  const setup = () => show('250 g bloem', '2 eieren', 'zout');

  // The first row cannot go up, the last filled row cannot go down; in between both work.
  test('the first row cannot go up', () => {
    setup();
    assert.equal(disabled(1)['Omhoog'], true);
  });

  test('the first row can go down', () => {
    setup();
    assert.equal(disabled(1)['Omlaag'], false);
  });

  test('a middle row can go up', () => {
    setup();
    assert.equal(disabled(2)['Omhoog'], false);
  });

  test('a middle row can go down', () => {
    setup();
    assert.equal(disabled(2)['Omlaag'], false);
  });

  test('the last filled row can go up', () => {
    setup();
    assert.equal(disabled(3)['Omhoog'], false);
  });

  test('the last filled row cannot go down', () => {
    setup();
    assert.equal(disabled(3)['Omlaag'], true);
  });
});

describe('recipe-ingredient-editing › Row buttons are one tab stop', () => {
  // The group comes before the field, has one button in the tab order, and the field is in the tab order after it.
  for (const n of [1, 2, 3]) {
    test(`row ${n} has one button in the tab order`, () => {
      show('250 g bloem', '2 eieren', 'zout');
      assert.equal(buttonsOf(n).filter((b) => b.getAttribute('tabindex') === '0').length, 1);
    });

    test(`row ${n} has its group before the field`, () => {
      show('250 g bloem', '2 eieren', 'zout');
      assert.ok(precedes(toolbar(n), field(n)));
    });

    test(`row ${n} has its field in the tab order`, () => {
      show('250 g bloem', '2 eieren', 'zout');
      assert.notEqual(field(n).getAttribute('tabindex'), '-1');
    });
  }

  // The arrow keys move between the buttons of the group.
  test('the arrow keys move between the buttons of the group', () => {
    show('250 g bloem', '2 eieren', 'zout');
    const [up, down] = buttonsOf(2);
    up.focus();
    press(up, 'ArrowRight');
    assert.ok(document.activeElement === down);
  });
});

describe('recipe-ingredient-editing › Alt and arrow move the row', () => {
  const setup = () => {
    show('250 g bloem', '2 eieren', 'zout');
    field(1).focus();
    field(1).setSelectionRange(3, 3);
    press(field(1), 'ArrowDown', { altKey: true });
  };

  test('Alt+ArrowDown moves the row down', () => {
    setup();
    assert.deepEqual(
      fields().map((f) => f.value),
      ['2 eieren', '250 g bloem', 'zout', ''],
    );
  });

  // Focus stays in the field of the moved row, with the cursor where it was.
  test('focus stays in the field of the moved row', () => {
    setup();
    assert.ok(document.activeElement === field(2));
  });

  test('the cursor stays where it was', () => {
    setup();
    assert.equal(field(2).selectionStart, 3);
  });

  test('Alt+ArrowUp moves the row back up', () => {
    setup();
    press(field(2), 'ArrowUp', { altKey: true });
    assert.equal(field(1).value, '250 g bloem');
  });

  test('focus follows the row back up', () => {
    setup();
    press(field(2), 'ArrowUp', { altKey: true });
    assert.ok(document.activeElement === field(1));
  });

  // At the edges nothing moves.
  test('at the top edge nothing moves', () => {
    setup();
    press(field(2), 'ArrowUp', { altKey: true });
    press(field(1), 'ArrowUp', { altKey: true });
    assert.equal(field(1).value, '250 g bloem');
  });
});

describe('recipe-ingredient-editing › Move is announced', () => {
  const live = () => screen.getByTestId('Announcement-live');

  test('the announcement is polite', () => {
    show('250 g bloem', '2 eieren', 'zout');
    assert.equal(live().getAttribute('aria-live'), 'polite');
  });

  test('the announcement is empty at first', () => {
    show('250 g bloem', '2 eieren', 'zout');
    assert.equal(live().textContent, '');
  });

  // The buttons of a row are up, down and delete.
  test('moving with the button announces the new place', () => {
    show('250 g bloem', '2 eieren', 'zout');
    fireEvent.click(buttonsOf(1)[1]);
    assert.equal(live().textContent, "Ingrediënt '250 g bloem' staat nu op plaats 2 van 3");
  });

  test('moving with the keys announces the new place', () => {
    show('250 g bloem', '2 eieren', 'zout');
    fireEvent.click(buttonsOf(1)[1]);
    press(field(2), 'ArrowDown', { altKey: true });
    assert.equal(live().textContent, "Ingrediënt '250 g bloem' staat nu op plaats 3 van 3");
  });
});
