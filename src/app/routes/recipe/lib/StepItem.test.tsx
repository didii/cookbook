import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
import { precedes, render, screen } from '~testing/dom';
import { StepItem } from './StepItem';

const plain = (body: string): Step => ({ body, ingredients: [] });
const renderStep = (step: Step, number = 1, done = false) => render(<StepItem step={step} number={number} done={done} onToggle={() => {}} />);
const ovenStep: Step = {
  body: 'Bak de taart.',
  ingredients: [{ quantityText: '1', name: 'ei' }],
  ovenTemperature: 180,
  timer: { minutes: 50, label: 'Bakken' },
};

describe('recipe-viewing › Step is marked done', () => {
  const step = plain('snijden');

  test('a step that is not done is not pressed and has an empty mark', () => {
    renderStep(step);
    assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'false');
    assert.equal(screen.getByTestId('StepItem-mark').textContent, '');
  });

  test('a step that is done is pressed and shows a check', () => {
    renderStep(step, 1, true);
    assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'true');
    assert.equal(screen.getByTestId('StepItem-mark').textContent, '✓');
  });
});

describe('recipe-viewing › Step without chips', () => {
  test('shows the label', () => {
    renderStep(plain('snijden'));
    assert.equal(screen.getByTestId('StepItem-label').textContent, 'Stap 1');
  });

  test('has one list item and no chip list', () => {
    const { container } = renderStep(plain('snijden'));
    assert.equal(container.querySelectorAll('li').length, 1);
    assert.equal(container.querySelector('ul'), null);
  });
});

describe('recipe-viewing › Chips beside the label', () => {
  const setup = () => {
    renderStep(ovenStep, 3); // oven and timer
    return {
      label: screen.getByTestId('StepItem-label'),
      oven: screen.getByTestId('StepChips-oven'),
      timer: screen.getByTestId('TimerChip-start'),
      body: screen.getByTestId('StepItem-body'),
    };
  };

  test('the label comes first, then the chips, all before the text', () => {
    const { label, oven, timer, body } = setup();
    assert.ok(precedes(label, oven) && precedes(oven, body) && precedes(timer, body));
  });

  test('the oven chip is quiet text, not a button', () => {
    const { oven } = setup();
    assert.equal(oven.closest('button'), null);
  });
});

describe('recipe-viewing › Chip without a matching ingredient row', () => {
  test('the quantity shows as bold text inside the chip', () => {
    renderStep({ body: 'kruid', ingredients: [{ quantityText: '1 snuf', name: 'zout' }] });
    const quantity = screen.getByTestId('StepChips-quantity');
    assert.equal(quantity.tagName, 'B');
    assert.equal(quantity.parentElement?.textContent, '1 snuf zout');
  });
});
