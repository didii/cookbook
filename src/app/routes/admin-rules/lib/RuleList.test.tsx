import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { act, fireEvent, openAutocomplete, render, screen } from '~testing/dom';
import { ensureFree, type RuleItem } from './rows';
import { RuleList } from './RuleList';

let count = 0;
const blank = (): RuleItem => ({ id: `new${count++}`, text: '' });

function List({ words = ['g', 'kg', 'ml'], suggestions }: { words?: string[]; suggestions?: string[] }) {
  const [rows, setRows] = useState(() =>
    ensureFree(
      words.map((text) => ({ id: `id-${text}`, text })),
      blank,
    ),
  );
  return <RuleList rows={rows} noun="Eenheid" blank={blank} suggestions={suggestions} onChange={setRows} />;
}

const fields = () => screen.getAllByTestId<HTMLInputElement>('RuleRow-field');
const texts = () => fields().map((f) => f.value);
const focused = () => fields().indexOf(document.activeElement as HTMLInputElement);
const press = (el: HTMLElement, key: string, init: object = {}) => fireEvent.keyDown(el, { key, ...init });
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const settle = () => act(async () => {});

describe('parsing-rules › Empty row at the end', () => {
  test('the list ends with one empty row', () => {
    render(<List />);
    assert.deepEqual(texts(), ['g', 'kg', 'ml', '']);
  });
});

describe('parsing-rules › Typing adds a row', () => {
  test('the empty row becomes a word and a new empty row follows', () => {
    render(<List />);
    type(fields()[3], 'el');
    assert.deepEqual(texts(), ['g', 'kg', 'ml', 'el', '']);
  });
});

describe('parsing-rules › Move between rows', () => {
  for (const key of ['Enter', 'ArrowDown'])
    test(`${key} goes to the next row`, () => {
      render(<List />);
      fields()[0].focus();
      press(fields()[0], key);
      assert.equal(focused(), 1);
    });

  test('ArrowUp goes back to the previous row', () => {
    render(<List />);
    fields()[1].focus();
    press(fields()[1], 'ArrowUp');
    assert.equal(focused(), 0);
  });
});

describe('parsing-rules › Move a row by keyboard', () => {
  test('Alt+ArrowUp moves the second row up', () => {
    render(<List />);
    press(fields()[1], 'ArrowUp', { altKey: true });
    assert.deepEqual(texts(), ['kg', 'g', 'ml', '']);
  });

  test('the field keeps focus and its caret', async () => {
    render(<List />);
    fields()[1].focus();
    fields()[1].setSelectionRange(1, 1);
    press(fields()[1], 'ArrowUp', { altKey: true });
    await settle();
    assert.equal(focused(), 0);
    assert.equal(fields()[0].selectionStart, 1);
  });

  test('the move is announced', () => {
    render(<List />);
    press(fields()[1], 'ArrowUp', { altKey: true });
    assert.ok(screen.getByTestId('Announcement-live').textContent);
  });

  test('the empty row cannot be moved', () => {
    render(<List />);
    press(fields()[3], 'ArrowUp', { altKey: true });
    assert.deepEqual(texts(), ['g', 'kg', 'ml', '']);
  });
});

describe('parsing-rules › Remove an empty row by keyboard', () => {
  test('the row is removed and focus goes to the row above', async () => {
    render(<List />);
    type(fields()[1], '');
    press(fields()[1], 'Backspace');
    await settle();
    assert.deepEqual(texts(), ['g', 'ml', '']);
    assert.equal(focused(), 0);
  });

  test('a row with text is kept', () => {
    render(<List />);
    press(fields()[1], 'Backspace');
    assert.deepEqual(texts(), ['g', 'kg', 'ml', '']);
  });
});

describe('parsing-rules › Remove a row with the cross', () => {
  test('the row is removed', () => {
    render(<List />);
    fireEvent.click(screen.getAllByTestId('RuleRow-remove')[1]);
    assert.deepEqual(texts(), ['g', 'ml', '']);
  });
});

// The grip is dragged with the pointer over the real positions of the rows; the hook `useReorder` has its own tests.
test.todo('parsing-rules › Reorder by dragging');

const options = () => screen.queryAllByTestId('RuleRow-option').map((o) => o.textContent);

describe('parsing-rules › Units are suggested', () => {
  test('focusing the empty row shows the suggestions', async () => {
    render(<List words={[]} suggestions={['blik', 'kopje']} />);
    fields()[0].focus();
    await screen.findAllByTestId('RuleRow-option');
    assert.deepEqual(options(), ['blik', 'kopje']);
    await settle();
  });
});

describe('parsing-rules › Suggestions follow the typing', () => {
  test('only the suggestions that contain the text are shown', async () => {
    render(<List words={[]} suggestions={['blik', 'kopje', 'Bloem']} />);
    openAutocomplete(fields()[0]);
    type(fields()[0], 'bl');
    await screen.findAllByTestId('RuleRow-option');
    assert.deepEqual(options(), ['blik', 'Bloem']);
    await settle();
  });
});

describe('parsing-rules › Take a suggestion', () => {
  test('ArrowDown and Enter fill the row and move no row', async () => {
    render(<List words={['g']} suggestions={['blik', 'kopje']} />);
    openAutocomplete(fields()[1]);
    await screen.findAllByTestId('RuleRow-option');
    press(fields()[1], 'ArrowDown');
    press(fields()[1], 'Enter');
    await settle();
    // Opening the list already picks the first suggestion, so one ArrowDown picks the second.
    assert.deepEqual(texts(), ['g', 'kopje', '']);
    assert.equal(focused(), 1);
  });
});

describe('parsing-rules › Another word is allowed', () => {
  test('a word that is not suggested stays in the row', async () => {
    render(<List words={[]} suggestions={['blik']} />);
    openAutocomplete(fields()[0]);
    type(fields()[0], 'druppel');
    await settle();
    assert.equal(fields()[0].value, 'druppel');
  });
});
