import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { act, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { SuggestInput } from './SuggestInput';

// The field is controlled, so the screen keeps the typed value.
function Field({ items }: { items: string[] }) {
  const [value, setValue] = useState('');
  return <SuggestInput id="field" items={items} value={value} onValueChange={setValue} />;
}
const options = () => screen.queryAllByTestId('SuggestInput-option').map((o) => o.textContent);
const typeInto = async (text: string) => {
  const field = screen.getByTestId('SuggestInput-field');
  openAutocomplete(field);
  fireEvent.change(field, { target: { value: text } });
  // Let the popup finish its work before the test ends, or it runs after the DOM is gone.
  await act(async () => {});
};

describe('tag-management › Category suggestions', () => {
  test('a suggestion that contains the text is offered', async () => {
    render(<Field items={['Gerecht', 'Seizoen']} />);
    await typeInto('ge');
    assert.deepEqual(options(), ['Gerecht']);
  });

  test('one that does not contain the text is not', async () => {
    render(<Field items={['Gerecht', 'Seizoen']} />);
    await typeInto('ge');
    assert.equal(options().includes('Seizoen'), false);
  });

  test('letter case and accents are ignored', async () => {
    render(<Field items={['Gelegenheid', 'Séizoen']} />);
    await typeInto('SEI');
    assert.deepEqual(options(), ['Séizoen']);
  });
});

describe('SuggestInput', () => {
  test('text that matches nothing stays as typed and offers nothing', async () => {
    render(<Field items={['Gerecht']} />);
    await typeInto('Gelegenheid');
    assert.equal(screen.getByTestId<HTMLInputElement>('SuggestInput-field').value, 'Gelegenheid');
    assert.deepEqual(options(), []);
  });
});
