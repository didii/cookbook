import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen, within } from '~testing/dom';
import { ChipsHarness, stepOf } from './chipsHarness';

// Needs a browser: hover, focus and visibility.
test.todo('recipe-step-chips › A ghost is shown only while its step is active');
// Needs a browser: layout while hovering from one step to another.
test.todo('recipe-step-chips › The add row keeps its space');
// Needs a browser: the colour of the underline in the text.
test.todo('recipe-step-chips › Following and pinned chips are marked differently');
// Needs a browser: pointer hover and the fill of the marked words.
test.todo('recipe-step-chips › Hovering a chip fills its words');

const initial = stepOf({ body: 'Bak 30 minuten op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 30 } });
const show = () => render(<ChipsHarness initial={initial} />);
const bar = () => screen.getByTestId('StepChips-toolbar');
/** The things in the tab order: the chips and the add buttons, but not the small icon buttons (those are for the pointer). */
const tabStops = () => [...bar().querySelectorAll('button')].filter((b) => b.getAttribute('tabindex') === '0');
const items = () => [...bar().querySelectorAll<HTMLElement>('[data-roving]')];

describe('recipe-step-chips › Chips are one tab stop', () => {
  /** Renders the chips with the first item focused. */
  const setup = () => {
    show();
    const [first, second] = items();
    first.focus();
    return { first, second };
  };

  test('only one chip is in the tab order', () => {
    show();
    assert.equal(tabStops().length, 1);
  });

  test('the first chip is the stop', () => {
    show();
    assert.ok(tabStops()[0] === items()[0]);
  });

  // The arrow keys move between the chips (and the add buttons), wrapping at the ends.
  test('ArrowRight moves to the next item', () => {
    const { first, second } = setup();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    assert.ok(document.activeElement === second);
  });

  test('ArrowLeft moves back', () => {
    const { first, second } = setup();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    fireEvent.keyDown(second, { key: 'ArrowLeft' });
    assert.ok(document.activeElement === first);
  });

  test('End moves to the last item', () => {
    const { first } = setup();
    fireEvent.keyDown(first, { key: 'End' });
    assert.ok(document.activeElement === items().at(-1));
  });

  test('Home moves to the first item', () => {
    const { first } = setup();
    fireEvent.keyDown(first, { key: 'End' });
    fireEvent.keyDown(items().at(-1)!, { key: 'Home' });
    assert.ok(document.activeElement === first);
  });

  // The chip used last is the stop, so the next Tab comes back to it.
  test('the last used chip is the only stop', () => {
    const { first, second } = setup();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    assert.equal(tabStops().length, 1);
    assert.ok(tabStops()[0] === second);
  });
});

describe('recipe-step-chips › Enter opens the popup', () => {
  // A chip is a real button, so Enter and Space press it like a click; the browser does that, not the page.
  // The step's chips are the oven and then the timer.
  const chip = () => screen.getAllByTestId('StepChips-chip')[1];
  test('the chip is a button', () => {
    show();
    assert.equal(chip().tagName, 'BUTTON');
  });

  test('the chip announces a dialog', () => {
    show();
    assert.equal(chip().getAttribute('aria-haspopup'), 'dialog');
  });

  test('clicking the chip opens the popup', () => {
    show();
    fireEvent.click(chip());
    assert.ok(screen.getByTestId('ChipPopup-dialog'));
  });
});

const timerChip = () => screen.getAllByTestId('StepChips-chip')[1] as HTMLButtonElement;
/** The small icon button beside a chip: it pins, or lets the chip follow again, and opens the popup. */
const iconOf = (chip: HTMLElement) => within(chip.parentElement!).getByTestId('StepChips-icon');
/** The two choices in the popup: follow the text, or pinned. */
const modes = () => {
  const [follow, pinned] = within(screen.getByTestId('ChipPopup-dialog')).getAllByTestId('ChipPopup-mode');
  return { follow, pinned };
};

describe('recipe-step-chips › Clicking the icon switches the mode and opens the popup', () => {
  /** Pins the following chip by its icon, then closes the popup. */
  const pinAndClose = () => {
    show();
    fireEvent.click(iconOf(timerChip()));
    fireEvent.keyDown(screen.getByTestId('NumberField-input'), { key: 'Escape' });
  };

  test('a following chip is pinned by its icon, and the popup shows "Vast"', () => {
    show();
    fireEvent.click(iconOf(timerChip()));
    assert.equal(modes().pinned.getAttribute('aria-pressed'), 'true');
  });

  test('the popup closes with Escape', () => {
    pinAndClose();
    assert.equal(screen.queryByTestId('ChipPopup-dialog'), null);
  });

  test('a pinned chip with anchor words offers to follow again', () => {
    pinAndClose();
    assert.ok(iconOf(timerChip()).getAttribute('aria-label')?.startsWith('Laten volgen'));
  });

  test('a pinned chip follows again by its icon, and the popup shows "Volgt tekst"', () => {
    pinAndClose();
    fireEvent.click(iconOf(timerChip()));
    assert.equal(modes().follow.getAttribute('aria-pressed'), 'true');
  });
});
