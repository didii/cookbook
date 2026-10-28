import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { StepText } from './StepText';

// Needs a browser: where the characters are drawn.
test.todo('recipe-step-editing › Marks sit under their characters');
// Needs a browser: the layout of text with and without marks.
test.todo('recipe-step-editing › Marks never move the text');
// Needs a browser: the height of the field.
test.todo('recipe-step-editing › Step field grows with its text');
// Needs a browser: the clipboard.
test.todo('recipe-step-editing › Pasted line breaks become spaces');

describe('StepText limits and errors', () => {
  test('the field takes at most maxLength characters', () => {
    render(<StepText label="Stap 1" value="" maxLength={42} onTextChange={() => {}} />);
    assert.equal(screen.getByTestId<HTMLTextAreaElement>('StepText-field').maxLength, 42);
  });

  test('an errorId marks the field invalid and described by it', () => {
    render(<StepText label="Stap 1" value="" errorId="why" onTextChange={() => {}} />);
    const field = screen.getByTestId('StepText-field');
    assert.equal(field.getAttribute('aria-invalid'), 'true');
    assert.equal(field.getAttribute('aria-describedby'), 'why');
  });

  test('without an errorId the field is not marked', () => {
    render(<StepText label="Stap 1" value="" onTextChange={() => {}} />);
    assert.equal(screen.getByTestId('StepText-field').getAttribute('aria-invalid'), null);
  });
});
