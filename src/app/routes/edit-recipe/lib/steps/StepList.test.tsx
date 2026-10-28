import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { noRows, stepOf } from './chipsHarness';
import { StepList } from './StepList';

// Needs a browser: key presses and focus.
test.todo('recipe-step-editing › Enter moves to the next step');
// Needs a browser: key presses and focus.
test.todo('recipe-step-editing › Enter in the last step changes nothing');
// Needs a browser: the disabled state of the buttons.
test.todo('recipe-step-editing › Buttons of the empty step are inert');
// Needs a browser: the disabled state of the buttons.
test.todo('recipe-step-editing › Insert is inert on the empty last step');
// Needs a browser: key presses and focus.
test.todo('recipe-step-editing › Backspace removes an empty step');
// Needs a browser: the disabled state of the buttons.
test.todo('recipe-step-editing › Edge steps cannot move out of the list');
// Needs a browser: pointer events and layout.
test.todo('recipe-step-editing › Step can be dragged');
// Needs a browser or a screen reader: the live region.
test.todo('recipe-step-editing › Step move is announced');
// Needs a browser: the Tab order.
test.todo('recipe-step-editing › Step buttons are one tab stop');
// Needs a browser: key presses, focus and the caret.
test.todo('recipe-step-editing › Alt and arrow move the step');

const steps = [stepOf({ body: 'een', ingredients: [] }), { ...stepOf({ body: 'twee', ingredients: [] }), id: 's2' }];
const noop = () => {};
const show = (props: Partial<Parameters<typeof StepList>[0]> = {}) =>
  render(
    <StepList
      steps={steps}
      contexts={[noRows, noRows]}
      onChips={noop}
      onAdd={noop}
      onType={noop}
      onEdit={noop}
      onRemove={noop}
      onRestore={noop}
      onMove={noop}
      {...props}
    />,
  );

describe('StepList errors', () => {
  test('a message shows on the step it is keyed to only', () => {
    show({ errors: { 1: 'Fout' } });
    const messages = screen.getAllByTestId('StepEditor-error');
    assert.equal(messages.length, 1);
    assert.equal(messages[0].textContent, 'Fout');
  });

  test('every step gets the maximum length', () => {
    show({ maxLength: 42 });
    for (const field of screen.getAllByTestId<HTMLTextAreaElement>('StepText-field')) assert.equal(field.maxLength, 42);
  });

  test('the first step in error is focused when focusErrors is set', () => {
    show({ errors: { 1: 'Fout' }, focusErrors: true });
    assert.ok(document.activeElement === screen.getAllByTestId('StepText-field')[1]);
  });

  test('nothing is focused without focusErrors', () => {
    show({ errors: { 1: 'Fout' } });
    assert.ok(document.activeElement !== screen.getAllByTestId('StepText-field')[1]);
  });
});
