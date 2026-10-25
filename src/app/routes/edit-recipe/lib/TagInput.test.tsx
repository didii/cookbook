import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { act, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { TagInput } from './TagInput';

// The field is controlled, so the screen keeps the picked tags.
function Field({ tags = ['Soep', 'Winter'], start = [] }: { tags?: string[]; start?: string[] }) {
  const [value, setValue] = useState(start);
  return <TagInput tags={tags} value={value} onValueChange={setValue} />;
}

const input = () => screen.getByTestId('TagInput-field');
const type = (text: string) => {
  openAutocomplete(input());
  fireEvent.change(input(), { target: { value: text } });
};
const options = () => screen.queryAllByTestId('TagInput-option').map((o) => o.textContent);
const picked = () => screen.queryAllByTestId('TagInput-tag').map((t) => t.textContent);
// Lets the popup finish its work before the test ends, or it runs after the DOM is gone.
const settle = () => act(async () => {});
const choose = async (label: string) => {
  fireEvent.click((await screen.findAllByTestId('TagInput-option')).find((o) => o.textContent === label)!);
  await settle();
};

describe('recipe-form › Stored tags are suggested', () => {
  test('a stored tag that contains the text is suggested', async () => {
    render(<Field />);
    type('so');
    await screen.findAllByTestId('TagInput-option');
    assert.deepEqual(options().slice(1), ['Soep']);
    await settle();
  });

  test('a tag that does not contain it is not', async () => {
    render(<Field />);
    type('so');
    await screen.findAllByTestId('TagInput-option');
    assert.ok(!options().includes('Winter'));
    await settle();
  });
});

describe('recipe-form › Suggestions ignore letter case and accents', () => {
  test('a tag with an accent is found without it', async () => {
    render(<Field tags={['Soép']} />);
    type('SOEP');
    await screen.findAllByTestId('TagInput-option');
    assert.ok(options().includes('Soép'));
    await settle();
  });

  test('a tag in another case is found', async () => {
    render(<Field tags={['soep']} />);
    type('SOEP');
    await screen.findAllByTestId('TagInput-option');
    assert.deepEqual(options(), ['soep']);
    await settle();
  });
});

describe('recipe-form › Picked tag is not suggested again', () => {
  test('the picked tag is left out', async () => {
    render(<Field start={['Soep']} />);
    type('so');
    await settle();
    assert.ok(!options().includes('Soep'));
  });
});

describe('recipe-form › A new tag can be added', () => {
  test('choosing the offer picks the typed text', async () => {
    render(<Field />);
    type('Kerst');
    await choose('Toevoegen: "Kerst"');
    assert.deepEqual(picked(), ['Kerst']);
  });
});

describe('recipe-form › Typing an existing tag in other case picks the stored tag', () => {
  test('Enter picks the stored spelling', async () => {
    render(<Field />);
    type('soep');
    await screen.findAllByTestId('TagInput-option');
    fireEvent.keyDown(input(), { key: 'Enter' });
    await settle();
    assert.deepEqual(picked(), ['Soep']);
  });

  test('no new tag is offered', async () => {
    render(<Field />);
    type('soep');
    await screen.findAllByTestId('TagInput-option');
    assert.deepEqual(options(), ['Soep']);
    await settle();
  });
});

describe('recipe-form › Picked tags are alphabetical', () => {
  test('the later pick that sorts first is shown first', async () => {
    render(<Field />);
    type('Winter');
    await choose('Winter');
    type('Soep');
    await choose('Soep');
    assert.deepEqual(picked(), ['Soep', 'Winter']);
  });
});

describe('recipe-form › A picked tag can be removed', () => {
  test('the tag is no longer picked', async () => {
    render(<Field start={['Soep', 'Winter']} />);
    fireEvent.click(screen.getAllByTestId('TagInput-remove')[0]);
    await settle();
    assert.deepEqual(picked(), ['Winter']);
  });
});

describe('recipe-form › Tag length is limited', () => {
  test('the field keeps only the first 100 characters', async () => {
    render(<Field />);
    type('a'.repeat(150));
    await settle();
    assert.equal((input() as HTMLInputElement).value, 'a'.repeat(100));
  });
});
