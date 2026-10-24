import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
import { fireEvent, render, screen } from '~testing/dom';
import { StepList } from './StepList';

const plain = (body: string): Step => ({ body, ingredients: [] });
const steps: Step[] = [
  plain('Kneed het deeg.'),
  { body: 'Laat het deeg 30 minuten rusten.', ingredients: [], timer: { minutes: 30, label: 'Deeg rust' } },
  { body: 'Bak de taart.', ingredients: [{ quantityText: '1', name: 'ei' }], ovenTemperature: 180, timer: { minutes: 50, label: 'Bakken' } },
  plain('Laat afkoelen.'),
];

const bodies = () => screen.getAllByTestId('StepItem-body');
const pressed = () => bodies().filter((b) => b.getAttribute('aria-pressed') === 'true');

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

// Needs layout: the chip group moves as one to the next line when it does not fit beside the label.
test.todo('recipe-viewing › Many chips');
