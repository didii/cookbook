import assert from 'node:assert/strict';
import { useState, type ReactNode } from 'react';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
import { defaultRules } from '~app/shared/rules';
import { fireEvent, render, screen, within } from '~testing/dom';
import { classifyStored, type StepChips as Chips, type Context, type StepDraft } from './chips';
import { StepChips } from './StepChips';

// Needs a browser: hover, focus and visibility.
test.todo('recipe-step-chips › A ghost is shown only while its step is active');
// Needs a browser: layout while hovering from one step to another.
test.todo('recipe-step-chips › The add row keeps its space');
// Needs a browser: the colour of the underline in the text.
test.todo('recipe-step-chips › Following and pinned chips are marked differently');
// Needs a browser: pointer hover and the fill of the marked words.
test.todo('recipe-step-chips › Hovering a chip fills its words');

export const noRows: Context = { rows: [], rules: defaultRules };

/** A step as the editor holds it, with the chips its stored form gives it. */
export const stepOf = (stored: Step, context: Context = noRows): StepDraft => ({ id: 's1', ...classifyStored(stored, context) });

/** The chips of a step wired to state, as the editor wires them. */
export function ChipsHarness({
  initial,
  context = noRows,
  extra,
}: {
  initial: Chips & { id: string };
  context?: Context;
  extra?: (step: StepDraft) => ReactNode;
}) {
  const [step, setStep] = useState<StepDraft>(initial);
  return (
    <div>
      <StepChips step={step} context={context} number={1} onHot={() => {}} onChange={(change) => setStep((s) => change(s, context))} />
      {extra?.(step)}
    </div>
  );
}

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
  const icon = () => screen.getAllByTestId('StepChips-icon')[1];
  /** The follow or pinned choice in the popup does what the icon button does: it pins, and lets the chip follow again. */
  const choices = () => {
    show();
    fireEvent.click(chip());
    const [follow, pinned] = within(screen.getByTestId('ChipPopup-dialog')).getAllByTestId('ChipPopup-mode');
    return { follow, pinned };
  };

  test('the chip shows its timer', () => {
    show();
    assert.match(chip().textContent ?? '', /30 min/);
  });

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
