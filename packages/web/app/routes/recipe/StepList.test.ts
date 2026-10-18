import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Step } from '~/lib/recipes';
import { toggled } from '~/lib/toggled';
import { StepItem } from './StepItem';
import { StepList } from './StepList';

const plain = (body: string): Step => ({ body, ingredients: [] });
const steps: Step[] = [
  plain('Kneed het deeg.'),
  { body: 'Laat het deeg 30 minuten rusten.', ingredients: [], timer: { minutes: 30, label: 'Deeg rust' } },
  { body: 'Bak de taart.', ingredients: [{ quantity_text: '1', name: 'ei' }], ovenTemperature: 180, timer: { minutes: 50, label: 'Bakken' } },
  plain('Laat afkoelen.'),
];

const renderStep = (step: Step, number = 1, done = false) =>
  renderToStaticMarkup(createElement(StepItem, { step, number, done, onToggle: () => {} }));

test('recipe-viewing › Steps are all readable', () => {
  const html = renderToStaticMarkup(createElement(StepList, { steps: steps }));
  for (const [i, s] of steps.entries()) {
    assert.ok(html.includes(`Stap ${i + 1}</span>`), `label of step ${i + 1}`);
    assert.ok(html.includes(s.body), `text of step ${i + 1}`);
  }
  assert.ok(!html.includes('aria-current'));
  assert.ok(!html.includes('Vorige') && !html.includes('Volgende'));
});

test('recipe-viewing › Step is marked done', () => {
  const step = plain('snijden');
  assert.ok(renderStep(step).includes('aria-pressed="false"'));
  assert.ok(!renderStep(step).includes('✓'));
  const done = renderStep(step, 1, true);
  assert.ok(done.includes('aria-pressed="true"') && done.includes('✓'));
  // Tapping again restores it.
  assert.deepEqual([...toggled(toggled(new Set<number>(), 3), 3)], []);
});

// Needs layout: the label, chips and text keep their positions because the square has the same size in both states.
test.todo('recipe-viewing › Nothing shifts when a step is done');

test('recipe-viewing › Marks are not kept', () => {
  assert.ok(!renderToStaticMarkup(createElement(StepList, { steps: steps })).includes('aria-pressed="true"'));
});

test('recipe-viewing › Step without chips', () => {
  const step = plain('snijden');
  const html = renderStep(step);
  assert.ok(html.includes('Stap 1'));
  assert.equal(html.match(/<li/g)?.length, 1);
  assert.ok(!html.includes('<ul'));
});

test('recipe-viewing › Chips beside the label', () => {
  const html = renderStep(steps[2], 3); // oven and timer
  const head = html.slice(0, html.indexOf('<button type="button" aria-pressed'));
  assert.ok(head.indexOf('Stap 3') < head.indexOf('180 °C'));
  assert.ok(head.includes('50 min'));
  // The oven chip is quiet text, the timer an operable button.
  assert.ok(head.includes('<li class="inline-flex') && head.includes('<li><button'));
});

test('recipe-viewing › Chip without a matching ingredient row', () => {
  const step = { body: 'kruid', ingredients: [{ quantity_text: '1 snuf', name: 'zout' }] };
  assert.ok(renderStep(step).includes('1 snuf</b> zout'));
});

// Needs layout: the chip group moves as one to the next line when it does not fit beside the label.
test.todo('recipe-viewing › Many chips');
