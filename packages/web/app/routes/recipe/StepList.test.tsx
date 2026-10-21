import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanup, fireEvent, precedes, render, screen } from '~testing/dom';
import type { Step } from '~/lib/recipe';
import { toggled } from '~/lib/toggled';
import { StepItem } from './StepItem';
import { StepList } from './StepList';

const plain = (body: string): Step => ({ body, ingredients: [] });
const steps: Step[] = [
  plain('Kneed het deeg.'),
  { body: 'Laat het deeg 30 minuten rusten.', ingredients: [], timer: { minutes: 30, label: 'Deeg rust' } },
  { body: 'Bak de taart.', ingredients: [{ quantityText: '1', name: 'ei' }], ovenTemperature: 180, timer: { minutes: 50, label: 'Bakken' } },
  plain('Laat afkoelen.'),
];

const renderStep = (step: Step, number = 1, done = false) => render(<StepItem step={step} number={number} done={done} onToggle={() => {}} />);

test('recipe-viewing › Steps are all readable', () => {
  const { container } = render(<StepList steps={steps} />);
  for (const [i, s] of steps.entries()) {
    assert.ok(screen.getByText(`Stap ${i + 1}`), `label of step ${i + 1}`);
    assert.ok(screen.getByRole('button', { name: s.body }), `text of step ${i + 1}`);
  }
  assert.equal(container.querySelector('[aria-current]'), null);
  assert.equal(screen.queryByText(/Vorige|Volgende/), null);
});

test('recipe-viewing › Step is marked done', () => {
  const step = plain('snijden');
  const view = renderStep(step);
  assert.ok(screen.getByRole('button', { name: 'snijden', pressed: false }));
  assert.equal(screen.queryByText('✓'), null);
  view.unmount();
  renderStep(step, 1, true);
  assert.ok(screen.getByRole('button', { name: 'snijden', pressed: true }) && screen.getByText('✓'));
  cleanup();
  // Tapping marks it, and tapping again restores it.
  render(<StepList steps={[step]} />);
  fireEvent.click(screen.getByRole('button', { name: 'snijden' }));
  assert.ok(screen.getByRole('button', { name: 'snijden', pressed: true }) && screen.getByText('✓'));
  fireEvent.click(screen.getByRole('button', { name: 'snijden' }));
  assert.ok(screen.getByRole('button', { name: 'snijden', pressed: false }));
  assert.deepEqual([...toggled(toggled(new Set<number>(), 3), 3)], []);
});

// Needs layout: the label, chips and text keep their positions because the square has the same size in both states.
test.todo('recipe-viewing › Nothing shifts when a step is done');

test('recipe-viewing › Marks are not kept', () => {
  render(<StepList steps={steps} />);
  assert.equal(screen.queryAllByRole('button', { pressed: true }).length, 0);
  // A mark made by hand is gone on a new page.
  fireEvent.click(screen.getByRole('button', { name: 'Kneed het deeg.' }));
  assert.equal(screen.queryAllByRole('button', { pressed: true }).length, 1);
  cleanup();
  render(<StepList steps={steps} />);
  assert.equal(screen.queryAllByRole('button', { pressed: true }).length, 0);
});

test('recipe-viewing › Step without chips', () => {
  const { container } = renderStep(plain('snijden'));
  assert.ok(screen.getByText('Stap 1'));
  assert.equal(container.querySelectorAll('li').length, 1);
  assert.equal(container.querySelector('ul'), null);
});

test('recipe-viewing › Chips beside the label', () => {
  renderStep(steps[2], 3); // oven and timer
  const label = screen.getByText('Stap 3');
  const oven = screen.getByText('180 °C');
  const timer = screen.getByRole('button', { name: /50 min/ });
  const body = screen.getByRole('button', { name: 'Bak de taart.' });
  // Label first, then the chips, all before the text.
  assert.ok(precedes(label, oven) && precedes(oven, body) && precedes(timer, body));
  // The oven chip is quiet text, the timer an operable button.
  assert.equal(oven.closest('button'), null);
});

test('recipe-viewing › Chip without a matching ingredient row', () => {
  const step = { body: 'kruid', ingredients: [{ quantityText: '1 snuf', name: 'zout' }] };
  renderStep(step);
  const quantity = screen.getByText('1 snuf');
  assert.equal(quantity.tagName, 'B');
  assert.equal(quantity.parentElement?.textContent, '1 snuf zout');
});

// Needs layout: the chip group moves as one to the next line when it does not fit beside the label.
test.todo('recipe-viewing › Many chips');
