import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { act, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { MultiSelect } from './MultiSelect';

const authors = ['Mama', 'Oma', 'Papa'];

// The field is controlled, so the test keeps the picked values.
function Field({ start = [] }: { start?: string[] }) {
  const [value, setValue] = useState(start);
  return <MultiSelect options={authors} value={value} onValueChange={setValue} placeholder="Iedereen" label="Van wie" />;
}

const input = () => screen.getByTestId('MultiSelect-field');
const type = (text: string) => {
  openAutocomplete(input());
  fireEvent.change(input(), { target: { value: text } });
};
const options = () => screen.queryAllByTestId('MultiSelect-option').map((o) => o.textContent);
const picked = () => screen.queryAllByTestId('MultiSelect-value').map((t) => t.textContent);
// Lets the popup finish its work before the test ends, or it runs after the DOM is gone.
const settle = () => act(async () => {});

describe('recipe-filtering › Finding an author by typing', () => {
  test('an author that contains the text is suggested', async () => {
    render(<Field />);
    type('pa');
    await screen.findAllByTestId('MultiSelect-option');
    assert.ok(options().includes('Papa'));
    await settle();
  });

  test('an author that does not contain it is not', async () => {
    render(<Field />);
    type('pa');
    await screen.findAllByTestId('MultiSelect-option');
    assert.ok(!options().includes('Oma'));
    await settle();
  });

  test('letter case is ignored', async () => {
    render(<Field />);
    type('PA');
    await screen.findAllByTestId('MultiSelect-option');
    assert.deepEqual(options(), ['Papa']);
    await settle();
  });
});

describe('recipe-filtering › Picked author is not suggested again', () => {
  test('a picked author is not among the suggestions', async () => {
    render(<Field start={['Papa']} />);
    type('pa');
    await settle();
    assert.deepEqual(options(), []);
  });
});

describe('recipe-filtering › Removing a picked author', () => {
  test('pressing the remove button unpicks it', async () => {
    render(<Field start={['Papa', 'Oma']} />);
    fireEvent.click(screen.getAllByTestId('MultiSelect-remove')[0]);
    await settle();
    assert.deepEqual(picked(), ['Oma']);
  });
});

describe('MultiSelect', () => {
  test('picking a suggestion adds a chip', async () => {
    render(<Field />);
    type('om');
    fireEvent.click((await screen.findAllByTestId('MultiSelect-option'))[0]);
    await settle();
    assert.deepEqual(picked(), ['Oma']);
  });

  test('text that matches nothing offers nothing', async () => {
    render(<Field />);
    type('zzz');
    await settle();
    assert.deepEqual(options(), []);
  });

  test('the placeholder shows while nothing is picked', () => {
    render(<Field />);
    assert.equal(input().getAttribute('placeholder'), 'Iedereen');
  });

  test('the placeholder is gone once something is picked', () => {
    render(<Field start={['Oma']} />);
    assert.equal(input().getAttribute('placeholder'), null);
  });

  test('a picked value that is no option still shows as a chip', () => {
    render(<Field start={['Tante An']} />);
    assert.deepEqual(picked(), ['Tante An']);
  });

  test('the field is named', () => {
    render(<Field />);
    assert.equal(input().getAttribute('aria-label'), 'Van wie');
  });
});
