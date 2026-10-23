import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen, within } from '~testing/dom';
import { ChipsHarness, stepOf } from './StepChips.test';

// A step with a timer and an oven chip, both following the words.
const initial = stepOf({ body: 'Bak 30 minuten op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 30 } });
const show = () => render(<ChipsHarness initial={initial} />);
// The step's chips are the oven and then the timer.
const timerChip = () => screen.getAllByTestId('StepChips-chip')[1] as HTMLButtonElement;
const popup = () => screen.queryByTestId('ChipPopup-dialog');
/** The small icon button beside a chip: it pins, or lets the chip follow again, and opens the popup. */
const iconOf = (chip: HTMLElement) => within(chip.parentElement!).getByTestId('StepChips-icon');
/** The two choices in the popup: follow the text, or pinned. */
const modes = () => {
  const [follow, pinned] = within(screen.getByTestId('ChipPopup-dialog')).getAllByTestId('ChipPopup-mode');
  return { follow, pinned };
};

test('recipe-step-chips › Clicking a chip opens its popup', () => {
  show();
  assert.equal(popup(), null);
  assert.match(timerChip().textContent ?? '', /30 min/);
  fireEvent.click(timerChip());
  // The popup has that chip's fields, the follow or pinned choice and a remove action, and sits next to its chip.
  const dialog = screen.getByTestId('ChipPopup-dialog');
  assert.equal(dialog.getAttribute('aria-label'), 'Timer aanpassen');
  assert.equal(within(dialog).getByTestId<HTMLInputElement>('NumberField-input').labels?.[0]?.textContent, 'Minuten');
  assert.equal(within(dialog).getByTestId<HTMLInputElement>('TextField-input').labels?.[0]?.textContent, 'Naam');
  assert.match(modes().follow.textContent ?? '', /Volgt tekst/);
  assert.match(modes().pinned.textContent ?? '', /Vast/);
  assert.equal(within(dialog).getByTestId('ChipPopup-remove').textContent, 'Timer verwijderen');
  assert.ok(dialog.parentElement === timerChip().closest('div.relative'));
  assert.equal(timerChip().getAttribute('aria-expanded'), 'true');
});

test('recipe-step-chips › Clicking the icon switches the mode and opens the popup', () => {
  show();
  // A following chip is pinned by its icon, and the popup opens showing "Vast".
  fireEvent.click(iconOf(timerChip()));
  assert.equal(modes().pinned.getAttribute('aria-pressed'), 'true');
  fireEvent.keyDown(screen.getByTestId('NumberField-input'), { key: 'Escape' });
  assert.equal(popup(), null);
  // A pinned chip with anchor words follows again by its icon, and the popup opens showing "Volgt tekst".
  assert.ok(iconOf(timerChip()).getAttribute('aria-label')?.startsWith('Laten volgen'));
  fireEvent.click(iconOf(timerChip()));
  assert.equal(modes().follow.getAttribute('aria-pressed'), 'true');
});

test('recipe-step-chips › The popup explains the two modes', () => {
  show();
  fireEvent.click(timerChip());
  const text = screen.getByTestId('ChipPopup-dialog').textContent ?? '';
  assert.match(text, /Volgt tekst:.*verandert mee met de tekst in de stap/);
  assert.match(text, /Vast:.*toont suggesties als de tekst wijzigt/);
});

test('recipe-step-chips › Escape closes the popup', () => {
  show();
  fireEvent.click(timerChip());
  const minutes = screen.getByTestId('NumberField-input');
  assert.ok(document.activeElement === minutes, 'the first field has focus');
  fireEvent.keyDown(minutes, { key: 'Escape' });
  assert.equal(popup(), null);
  // Focus is back on the chip.
  assert.ok(document.activeElement === timerChip(), 'focus returns to the chip');
});
