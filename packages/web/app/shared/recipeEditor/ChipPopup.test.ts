import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fireEvent, render, screen, within } from '~testing/dom';
import { ChipsHarness, stepOf } from '~testing/stepChips';
import { createElement } from 'react';

// A step with a timer and an oven chip, both following the words.
const initial = stepOf({ body: 'Bak 30 minuten op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 30 } });
const show = () => render(createElement(ChipsHarness, { initial }));
const timerChip = () => screen.getByRole('button', { name: /30 min/, expanded: undefined }) as HTMLButtonElement;
const popup = () => screen.queryByRole('dialog');
/** The small icon button beside a chip: it pins, or lets the chip follow again, and opens the popup. */
const iconOf = (chip: HTMLElement) => within(chip.parentElement!).getByRole('button', { name: /en openen$/ });

test('recipe-step-chips › Clicking a chip opens its popup', () => {
  show();
  assert.equal(popup(), null);
  fireEvent.click(timerChip());
  // The popup has that chip's fields, the follow or pinned choice and a remove action, and sits next to its chip.
  const dialog = screen.getByRole('dialog', { name: 'Timer aanpassen' });
  assert.ok(within(dialog).getByLabelText('Minuten') && within(dialog).getByLabelText('Naam'));
  assert.ok(within(dialog).getByRole('button', { name: /Volgt tekst/ }) && within(dialog).getByRole('button', { name: /Vast/ }));
  assert.ok(within(dialog).getByRole('button', { name: 'Timer verwijderen' }));
  assert.ok(dialog.parentElement === timerChip().closest('div.relative'));
  assert.equal(timerChip().getAttribute('aria-expanded'), 'true');
});

test('recipe-step-chips › Clicking the icon switches the mode and opens the popup', () => {
  show();
  // A following chip is pinned by its icon, and the popup opens showing "Vast".
  fireEvent.click(iconOf(timerChip()));
  assert.equal(within(screen.getByRole('dialog')).getByRole<HTMLButtonElement>('button', { name: /^Vast/ }).getAttribute('aria-pressed'), 'true');
  fireEvent.keyDown(screen.getByLabelText('Minuten'), { key: 'Escape' });
  assert.equal(popup(), null);
  // A pinned chip with anchor words follows again by its icon, and the popup opens showing "Volgt tekst".
  assert.ok(iconOf(timerChip()).getAttribute('aria-label')?.startsWith('Laten volgen'));
  fireEvent.click(iconOf(timerChip()));
  assert.equal(
    within(screen.getByRole('dialog'))
      .getByRole('button', { name: /^Volgt tekst/ })
      .getAttribute('aria-pressed'),
    'true',
  );
});

test('recipe-step-chips › The popup explains the two modes', () => {
  show();
  fireEvent.click(timerChip());
  const text = screen.getByRole('dialog').textContent ?? '';
  assert.match(text, /Volgt tekst:.*verandert mee met de tekst in de stap/);
  assert.match(text, /Vast:.*toont suggesties als de tekst wijzigt/);
});

test('recipe-step-chips › Escape closes the popup', () => {
  show();
  fireEvent.click(timerChip());
  const minutes = screen.getByLabelText('Minuten');
  assert.ok(document.activeElement === minutes, 'the first field has focus');
  fireEvent.keyDown(minutes, { key: 'Escape' });
  assert.equal(popup(), null);
  // Focus is back on the chip.
  assert.ok(document.activeElement === timerChip(), 'focus returns to the chip');
});
