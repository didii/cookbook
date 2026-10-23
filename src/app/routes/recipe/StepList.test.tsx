import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanup, fireEvent, precedes, render, screen } from '~testing/dom';
import type { Step } from '~app/lib/recipe';
import { toggled } from '~app/lib/toggled';
import { StepItem } from './StepItem';
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

const renderStep = (step: Step, number = 1, done = false) => render(<StepItem step={step} number={number} done={done} onToggle={() => {}} />);

test('recipe-viewing › Steps are all readable', () => {
  const { container } = render(<StepList steps={steps} />);
  for (const [i, s] of steps.entries()) {
    assert.equal(screen.getAllByTestId('StepItem-label')[i].textContent, `Stap ${i + 1}`, `label of step ${i + 1}`);
    assert.equal(bodies()[i].textContent, s.body, `text of step ${i + 1}`);
    assert.equal(bodies()[i].tagName, 'BUTTON');
  }
  assert.equal(container.querySelector('[aria-current]'), null);
  assert.doesNotMatch(container.textContent!, /Vorige|Volgende/);
});

test('recipe-viewing › Step is marked done', () => {
  const step = plain('snijden');
  const view = renderStep(step);
  assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'false');
  assert.equal(screen.getByTestId('StepItem-mark').textContent, '');
  view.unmount();
  renderStep(step, 1, true);
  assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'true');
  assert.equal(screen.getByTestId('StepItem-mark').textContent, '✓');
  cleanup();
  // Tapping marks it, and tapping again restores it.
  render(<StepList steps={[step]} />);
  fireEvent.click(screen.getByTestId('StepItem-body'));
  assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'true');
  assert.equal(screen.getByTestId('StepItem-mark').textContent, '✓');
  fireEvent.click(screen.getByTestId('StepItem-body'));
  assert.equal(screen.getByTestId('StepItem-body').getAttribute('aria-pressed'), 'false');
  assert.deepEqual([...toggled(toggled(new Set<number>(), 3), 3)], []);
});

// Needs layout: the label, chips and text keep their positions because the square has the same size in both states.
test.todo('recipe-viewing › Nothing shifts when a step is done');

test('recipe-viewing › Marks are not kept', () => {
  render(<StepList steps={steps} />);
  assert.equal(pressed().length, 0);
  // A mark made by hand is gone on a new page.
  fireEvent.click(bodies()[0]);
  assert.equal(pressed().length, 1);
  cleanup();
  render(<StepList steps={steps} />);
  assert.equal(pressed().length, 0);
});

test('recipe-viewing › Step without chips', () => {
  const { container } = renderStep(plain('snijden'));
  assert.equal(screen.getByTestId('StepItem-label').textContent, 'Stap 1');
  assert.equal(container.querySelectorAll('li').length, 1);
  assert.equal(container.querySelector('ul'), null);
});

test('recipe-viewing › Chips beside the label', () => {
  renderStep(steps[2], 3); // oven and timer
  const label = screen.getByTestId('StepItem-label');
  const oven = screen.getByTestId('StepChips-oven');
  const timer = screen.getByTestId('TimerChip-start');
  const body = screen.getByTestId('StepItem-body');
  // Label first, then the chips, all before the text.
  assert.ok(precedes(label, oven) && precedes(oven, body) && precedes(timer, body));
  // The oven chip is quiet text, the timer an operable button.
  assert.equal(oven.closest('button'), null);
});

test('recipe-viewing › Chip without a matching ingredient row', () => {
  const step = { body: 'kruid', ingredients: [{ quantityText: '1 snuf', name: 'zout' }] };
  renderStep(step);
  const quantity = screen.getByTestId('StepChips-quantity');
  assert.equal(quantity.tagName, 'B');
  assert.equal(quantity.parentElement?.textContent, '1 snuf zout');
});

// Needs layout: the chip group moves as one to the next line when it does not fit beside the label.
test.todo('recipe-viewing › Many chips');
