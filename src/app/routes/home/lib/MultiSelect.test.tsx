import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { act, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { MultiSelect } from './MultiSelect';

const authors = ['Mama', 'Oma', 'Papa'];

// The field is controlled, so the test keeps the picked values.
function Field({ start = [], options: choices = authors }: { start?: string[]; options?: string[] }) {
  const [value, setValue] = useState(start);
  return <MultiSelect options={choices} value={value} onValueChange={setValue} placeholder="Iedereen" label="Van wie" />;
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

  test('accents are ignored', async () => {
    render(<Field options={['Èlise', 'Oma']} />);
    type('eli');
    await screen.findAllByTestId('MultiSelect-option');
    assert.deepEqual(options(), ['Èlise']);
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
    type('a');
    await screen.findAllByTestId('MultiSelect-option');
    assert.ok(options().includes('Mama'));
    assert.ok(!options().includes('Papa'));
    await settle();
  });

  test('a picked value in another letter case counts as picked', async () => {
    render(<Field start={['oma']} />);
    type('a');
    await screen.findAllByTestId('MultiSelect-option');
    assert.ok(!options().includes('Oma'));
    await settle();
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

describe('recipe-filtering › Finding a tag by typing', () => {
  test('a tag that contains the text is suggested and another is not', async () => {
    render(<Field options={['Soep', 'Dessert']} />);
    type('soe');
    await screen.findAllByTestId('MultiSelect-option');
    assert.deepEqual(options(), ['Soep']);
    await settle();
  });
});

describe('recipe-filtering › Unknown text is not offered', () => {
  test('no suggestion is shown', async () => {
    render(<Field options={['Soep', 'Dessert']} />);
    type('s');
    await screen.findAllByTestId('MultiSelect-option');
    fireEvent.change(input(), { target: { value: 'zzz' } });
    await settle();
    assert.deepEqual(options(), []);
  });

  test('nothing can be added with Enter', async () => {
    render(<Field options={['Soep', 'Dessert']} />);
    type('s');
    await screen.findAllByTestId('MultiSelect-option');
    fireEvent.change(input(), { target: { value: 'zzz' } });
    await settle();
    fireEvent.keyDown(input(), { key: 'Enter' });
    await settle();
    assert.deepEqual(picked(), []);
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
    type('a');
    await screen.findAllByTestId('MultiSelect-option');
    fireEvent.change(input(), { target: { value: 'zzz' } });
    await settle();
    assert.deepEqual(options(), []);
  });

  test('Enter on text that matches nothing picks nothing', async () => {
    render(<Field />);
    type('a');
    await screen.findAllByTestId('MultiSelect-option');
    fireEvent.change(input(), { target: { value: 'zzz' } });
    await settle();
    fireEvent.keyDown(input(), { key: 'Enter' });
    await settle();
    assert.deepEqual(picked(), []);
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

// The sheet around the field keeps itself open for an Escape that was handled here, so the field must claim exactly the one that closes its popup.
describe('MultiSelect Escape', () => {
  test('Escape with the suggestions open is handled', async () => {
    render(<Field />);
    type('a');
    await screen.findAllByTestId('MultiSelect-option');
    assert.equal(fireEvent.keyDown(input(), { key: 'Escape' }), false);
    await settle();
  });

  test('Escape with the suggestions closed is left alone', async () => {
    render(<Field />);
    input().focus();
    assert.equal(fireEvent.keyDown(input(), { key: 'Escape' }), true);
    await settle();
  });
});

describe('MultiSelect remove button', () => {
  test('is at least 44px square', async () => {
    render(<Field start={['Oma']} />);
    const css = await cssFor(screen.getByTestId('MultiSelect-remove').className);
    assert.match(css, /width: calc\(var\(--spacing\) \* 11\)/);
    assert.match(css, /height: calc\(var\(--spacing\) \* 11\)/);
  });
});

// The remove button has no hard shadow, so nothing in its classes moves or unshadows it on :active.
describe('button-press › Pressing a chip', () => {
  const classes = () => screen.getByTestId('MultiSelect-remove').className;

  test('the remove button has no :active rule', async () => {
    render(<Field start={['Oma']} />);
    assert.doesNotMatch(await cssFor(classes()), /:active/);
  });

  test('the remove button neither moves nor has a shadow', async () => {
    render(<Field start={['Oma']} />);
    assert.doesNotMatch(await cssFor(classes()), /translate|box-shadow|shadow-hard/);
  });
});
