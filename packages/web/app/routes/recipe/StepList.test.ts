import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appeltaartSteps } from '~testing/steps';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toSteps } from '~/lib/steps';
import { StepList } from './StepList';

test('recipe-viewing › Step without chips', () => {
  const [step] = toSteps(['snijden']);
  assert.deepEqual(step.chips, { ingredients: [], oven: [], timers: [] });
  const html = renderToStaticMarkup(createElement(StepList, { steps: [step] }));
  assert.ok(html.includes('snijden'));
  assert.ok(html.includes('Stap 1'));
  assert.equal(html.match(/<li/g)?.length, 1);
});

test('the Appeltaart fixture has 13 steps', () => {
  assert.equal(appeltaartSteps.length, 13);
});
