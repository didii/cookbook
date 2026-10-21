import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen, within } from '~testing/dom';
import { ChipsHarness, stepOf } from '~testing/stepChips';

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
const bar = () => screen.getByRole('toolbar', { name: 'Chips van stap 1' });
/** The things in the tab order: the chips and the add buttons, but not the small icon buttons (those are for the pointer). */
const tabStops = () =>
  within(bar())
    .getAllByRole('button')
    .filter((b) => b.getAttribute('tabindex') === '0');
const items = () => [...bar().querySelectorAll<HTMLElement>('[data-roving]')];

test('recipe-step-chips › Chips are one tab stop', () => {
  show();
  assert.equal(tabStops().length, 1);
  assert.ok(tabStops()[0] === items()[0], 'the first chip is the stop');
  // The arrow keys move between the chips (and the add buttons), wrapping at the ends.
  const [first, second] = items();
  first.focus();
  fireEvent.keyDown(first, { key: 'ArrowRight' });
  assert.ok(document.activeElement === second, 'right');
  fireEvent.keyDown(second, { key: 'ArrowLeft' });
  assert.ok(document.activeElement === first, 'left');
  fireEvent.keyDown(first, { key: 'End' });
  assert.ok(document.activeElement === items().at(-1), 'end');
  fireEvent.keyDown(items().at(-1)!, { key: 'Home' });
  assert.ok(document.activeElement === first, 'home');
  // The chip used last is the stop, so the next Tab comes back to it.
  fireEvent.keyDown(first, { key: 'ArrowRight' });
  assert.equal(tabStops().length, 1);
  assert.ok(tabStops()[0] === second, 'the last used chip is the stop');
});

test('recipe-step-chips › Enter opens the popup', () => {
  show();
  // A chip is a real button, so Enter and Space press it like a click; the browser does that, not the page.
  const chip = screen.getByRole('button', { name: /30 min/ });
  assert.equal(chip.tagName, 'BUTTON');
  assert.equal(chip.getAttribute('aria-haspopup'), 'dialog');
  fireEvent.click(chip);
  const dialog = screen.getByRole('dialog');
  // The follow or pinned choice in the popup does what the icon button does: it pins, and lets the chip follow again.
  const mode = (name: RegExp) => within(dialog).getByRole('button', { name });
  fireEvent.click(mode(/^Vast/));
  assert.equal(mode(/^Vast/).getAttribute('aria-pressed'), 'true');
  assert.ok(screen.getByRole('button', { name: 'Laten volgen en openen' }));
  fireEvent.click(mode(/^Volgt tekst/));
  assert.equal(mode(/^Volgt tekst/).getAttribute('aria-pressed'), 'true');
  assert.equal(screen.queryByRole('button', { name: 'Laten volgen en openen' }), null);
});
