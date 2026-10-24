import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen, within } from '~testing/dom';
import { ChipsHarness, stepOf } from './chipsHarness';

// A step with a timer and an oven chip, both following the words.
const initial = stepOf({ body: 'Bak 30 minuten op 180 graden.', ingredients: [], ovenTemperature: 180, timer: { minutes: 30 } });
const show = () => render(<ChipsHarness initial={initial} />);
// The step's chips are the oven and then the timer.
const timerChip = () => screen.getAllByTestId('StepChips-chip')[1] as HTMLButtonElement;
const popup = () => screen.queryByTestId('ChipPopup-dialog');
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

  // The popup has that chip's fields, the follow or pinned choice and a remove action, and sits next to its chip.
  test('the popup has an accessible name', () => {
    assert.ok(open().getAttribute('aria-label'));
  });

  test('the popup has a labelled minutes field', () => {
    assert.ok(within(open()).getByTestId<HTMLInputElement>('NumberField-input').labels?.[0]);
  });

  test('the popup has a labelled name field', () => {
    assert.ok(within(open()).getByTestId<HTMLInputElement>('TextField-input').labels?.[0]);
  });

  test('the popup has the follow choice, pressed for a following chip', () => {
    open();
    assert.equal(modes().follow.getAttribute('aria-pressed'), 'true');
  });

  test('the popup has the pinned choice, not pressed for a following chip', () => {
    open();
    assert.equal(modes().pinned.getAttribute('aria-pressed'), 'false');
  });

  test('the popup has a remove action', () => {
    assert.ok(within(open()).getByTestId('ChipPopup-remove'));
  });

  test('the popup sits next to its chip', () => {
    assert.ok(open().parentElement === timerChip().closest('div.relative'));
  });

  test('the chip is marked expanded', () => {
    open();
    assert.equal(timerChip().getAttribute('aria-expanded'), 'true');
  });
});

describe('recipe-step-chips › The popup explains the two modes', () => {
  const explanation = () => {
    show();
    fireEvent.click(timerChip());
    return screen.getByTestId('ChipPopup-explanation').textContent ?? '';
  };

  test('explains following the text', () => {
    const text = explanation();
    assert.ok(text.includes(modes().follow.textContent!.trim()));
  });

  test('explains pinned', () => {
    const text = explanation();
    assert.ok(text.includes(modes().pinned.textContent!.trim()));
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

// The follow or pinned choice in the popup does what the icon button beside the chip does: it pins, and lets the chip follow again.
describe('the popup mode choices', () => {
  const icon = () => screen.getAllByTestId('StepChips-icon')[1];
  const choices = () => {
    show();
    fireEvent.click(timerChip());
    return modes();
  };

  test('the pinned choice pins the chip', () => {
    const { pinned } = choices();
    fireEvent.click(pinned);
    assert.equal(pinned.getAttribute('aria-pressed'), 'true');
  });

  test('the pinned choice changes the icon to offer following', () => {
    const { pinned } = choices();
    fireEvent.click(pinned);
    assert.equal(icon().getAttribute('aria-label'), 'Laten volgen en openen');
  });

  test('the follow choice lets the chip follow again', () => {
    const { follow, pinned } = choices();
    fireEvent.click(pinned);
    fireEvent.click(follow);
    assert.equal(follow.getAttribute('aria-pressed'), 'true');
  });

  test('the follow choice changes the icon to offer pinning', () => {
    const { follow, pinned } = choices();
    fireEvent.click(pinned);
    fireEvent.click(follow);
    assert.equal(icon().getAttribute('aria-label'), 'Vastzetten en openen');
  });
});
