import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
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

describe('recipe-step-chips › Clicking a chip opens its popup', () => {
  const open = () => {
    show();
    fireEvent.click(timerChip());
    return screen.getByTestId('ChipPopup-dialog');
  };

  test('the popup is closed before clicking', () => {
    show();
    assert.equal(popup(), null);
  });

  test('the chip shows its timer', () => {
    show();
    assert.match(timerChip().textContent ?? '', /30 min/);
  });

  // The popup has that chip's fields, the follow or pinned choice and a remove action, and sits next to its chip.
  test('the popup is named after the chip', () => {
    assert.equal(open().getAttribute('aria-label'), 'Timer aanpassen');
  });

  test('the popup has a minutes field', () => {
    assert.equal(within(open()).getByTestId<HTMLInputElement>('NumberField-input').labels?.[0]?.textContent, 'Minuten');
  });

  test('the popup has a name field', () => {
    assert.equal(within(open()).getByTestId<HTMLInputElement>('TextField-input').labels?.[0]?.textContent, 'Naam');
  });

  test('the popup has the follow choice', () => {
    open();
    assert.match(modes().follow.textContent ?? '', /Volgt tekst/);
  });

  test('the popup has the pinned choice', () => {
    open();
    assert.match(modes().pinned.textContent ?? '', /Vast/);
  });

  test('the popup has a remove action', () => {
    assert.equal(within(open()).getByTestId('ChipPopup-remove').textContent, 'Timer verwijderen');
  });

  test('the popup sits next to its chip', () => {
    assert.ok(open().parentElement === timerChip().closest('div.relative'));
  });

  test('the chip is marked expanded', () => {
    open();
    assert.equal(timerChip().getAttribute('aria-expanded'), 'true');
  });
});

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
    assert.equal(popup(), null);
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

describe('recipe-step-chips › The popup explains the two modes', () => {
  const text = () => {
    show();
    fireEvent.click(timerChip());
    return screen.getByTestId('ChipPopup-dialog').textContent ?? '';
  };

  test('explains following the text', () => {
    assert.match(text(), /Volgt tekst:.*verandert mee met de tekst in de stap/);
  });

  test('explains pinned', () => {
    assert.match(text(), /Vast:.*toont suggesties als de tekst wijzigt/);
  });
});

describe('recipe-step-chips › Escape closes the popup', () => {
  const open = () => {
    show();
    fireEvent.click(timerChip());
    return screen.getByTestId('NumberField-input');
  };

  test('the first field has focus', () => {
    const minutes = open();
    assert.ok(document.activeElement === minutes);
  });

  test('Escape closes the popup', () => {
    fireEvent.keyDown(open(), { key: 'Escape' });
    assert.equal(popup(), null);
  });

  test('focus returns to the chip', () => {
    fireEvent.keyDown(open(), { key: 'Escape' });
    assert.ok(document.activeElement === timerChip());
  });
});
