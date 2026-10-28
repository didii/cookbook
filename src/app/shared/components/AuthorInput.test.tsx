import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { act, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { AuthorInput } from './AuthorInput';

// The field is controlled, so the screen keeps the typed value.
function Field() {
  const [value, setValue] = useState('');
  return <AuthorInput id="author" authors={['Oma', 'Mama']} value={value} onValueChange={setValue} />;
}

describe('recipe-creation › Suggestions ignore letter case', () => {
  test('lower case typing finds the capitalised author', async () => {
    render(<Field />);
    const author = screen.getByTestId('AuthorInput-field');
    openAutocomplete(author);
    fireEvent.change(author, { target: { value: 'oma' } });
    const options = await screen.findAllByTestId('AuthorInput-option');
    assert.deepEqual(
      options.map((o) => o.textContent),
      ['Oma'],
    );
    // Let the popup finish its work before the test ends, or it runs after the DOM is gone.
    await act(async () => {});
  });
});

describe('AuthorInput maxLength', () => {
  test('the field takes at most maxLength characters', () => {
    render(<AuthorInput id="author" authors={[]} value="" onValueChange={() => {}} maxLength={42} />);
    assert.equal(screen.getByTestId<HTMLInputElement>('AuthorInput-field').maxLength, 42);
  });
});
