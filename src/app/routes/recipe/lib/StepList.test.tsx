import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { StepItem } from './StepItem';
import { StepList } from './StepList';
import { toggled } from './toggled';

const plain = (body: string): Step => ({ body, ingredients: [] });
const steps: Step[] = [
  plain('Kneed het deeg.'),
  { body: 'Laat het deeg 30 minuten rusten.', ingredients: [], timer: { minutes: 30, label: 'Deeg rust' } },
  { body: 'Bak de taart.', ingredients: [{ quantityText: '1', name: 'ei' }], ovenTemperature: 180, timer: { minutes: 50, label: 'Bakken' } },
  plain('Laat afkoelen.'),
];

const bodies = () => screen.getAllByTestId('StepItem-body');
const pressed = () => bodies().filter((b) => b.getAttribute('aria-pressed') === 'true');

const renderStep = (step: Step, number = 1, done = false) => render(<StepItem step={step} number={number} done={done} onToggle={() => {}} />);

describe('recipe-viewing › Steps are all readable', () => {
  test('every step shows its number and text', () => {
    render(<StepList steps={steps} />);
    for (const [i, s] of steps.entries()) {
      assert.equal(screen.getAllByTestId('StepItem-label')[i].textContent, `Stap ${i + 1}`, `label of step ${i + 1}`);
      assert.equal(bodies()[i].textContent, s.body, `text of step ${i + 1}`);
      assert.equal(bodies()[i].tagName, 'BUTTON');
    }
  });

  test('no step is marked as current', () => {
    const { container } = render(<StepList steps={steps} />);
    assert.equal(container.querySelector('[aria-current]'), null);
  });

  test('there are no previous or next buttons', () => {
    const { container } = render(<StepList steps={steps} />);
    assert.doesNotMatch(container.textContent!, /Vorige|Volgende/);
  });
});

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

  test('tapping marks the step', () => {
    render(<StepList steps={[step]} />);
    fireEvent.click(screen.getByTestId('StepItem-body'));
    assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'true');
    assert.equal(screen.getByTestId('StepItem-mark').textContent, '✓');
  });

  test('tapping again restores the step', () => {
    render(<StepList steps={[step]} />);
    fireEvent.click(screen.getByTestId('StepItem-body'));
    fireEvent.click(screen.getByTestId('StepItem-body'));
    assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'false');
  });

  test('toggling a step twice gives an empty set', () => {
    assert.deepEqual([...toggled(toggled(new Set<number>(), 3), 3)], []);
  });
});

// Needs layout: the label, chips and text keep their positions because the square has the same size in both states.
test.todo('recipe-viewing › Nothing shifts when a step is done');

describe('recipe-viewing › Marks are not kept', () => {
  test('no step is marked at first', () => {
    render(<StepList steps={steps} />);
    assert.equal(pressed().length, 0);
  });

  test('a mark made by hand shows', () => {
    render(<StepList steps={steps} />);
    fireEvent.click(bodies()[0]);
    assert.equal(pressed().length, 1);
  });

  test('a mark made by hand is gone on a new page', () => {
    const first = render(<StepList steps={steps} />);
    fireEvent.click(bodies()[0]);
    first.unmount();
    render(<StepList steps={steps} />);
    assert.equal(pressed().length, 0);
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
    renderStep(steps[2], 3); // oven and timer
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

// Needs layout: the chip group moves as one to the next line when it does not fit beside the label.
test.todo('recipe-viewing › Many chips');
