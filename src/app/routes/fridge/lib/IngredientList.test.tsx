import assert from 'node:assert/strict';
import { useState } from 'react';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { IngredientList, type ListKind } from './IngredientList';

/** The list kept in state, as the page keeps it. */
function Harness({ kind = 'heb', initial = [] }: { kind?: ListKind; initial?: string[] }) {
  const [entries, setEntries] = useState(initial);
  return (
    <IngredientList
      kind={kind}
      entries={entries}
      onAdd={(text) => setEntries((e) => [...e, text])}
      onRemove={(x) => setEntries((e) => e.filter((y) => y !== x))}
    />
  );
}

const input = () => screen.getByTestId<HTMLInputElement>('IngredientList-input');
const type = (text: string) => fireEvent.change(input(), { target: { value: text } });
const enter = () => fireEvent.keyDown(input(), { key: 'Enter' });
const chips = () => screen.queryAllByTestId('IngredientList-entry').map((c) => c.textContent);

describe('fridge-search › Adding with Enter', () => {
  test('the chip is shown', () => {
    render(<Harness />);
    type('kip');
    enter();
    assert.deepEqual(chips(), ['kip']);
  });

  test('the input is empty and has the focus', () => {
    render(<Harness />);
    type('kip');
    enter();
    assert.equal(input().value, '');
    assert.equal(document.activeElement, input());
  });

  test('the text is trimmed and runs of spaces are made one', () => {
    render(<Harness />);
    type('  rode   ui ');
    enter();
    assert.deepEqual(chips(), ['rode ui']);
  });
});

describe('fridge-search › Adding with the button', () => {
  test('the chip is in the list', () => {
    render(<Harness kind="zonder" />);
    type('spruitjes');
    fireEvent.click(screen.getByTestId('IngredientList-button'));
    assert.deepEqual(chips(), ['spruitjes']);
  });

  test('the input is empty and has the focus', () => {
    render(<Harness kind="zonder" />);
    type('spruitjes');
    fireEvent.click(screen.getByTestId('IngredientList-button'));
    assert.equal(input().value, '');
    assert.equal(document.activeElement, input());
  });
});

describe('fridge-search › Adding several in a row', () => {
  test('both chips are in the list', () => {
    render(<Harness />);
    type('kip');
    enter();
    type('rijst');
    enter();
    assert.deepEqual(chips(), ['kip', 'rijst']);
  });
});

describe('fridge-search › Empty text', () => {
  test('no chip is added', () => {
    render(<Harness />);
    enter();
    type('   ');
    enter();
    assert.deepEqual(chips(), []);
  });
});

describe('fridge-search › The same word twice', () => {
  test('the list still has one chip', () => {
    render(<Harness initial={['Kip']} />);
    type('kip');
    enter();
    assert.deepEqual(chips(), ['Kip']);
  });

  test('the input is emptied', () => {
    render(<Harness initial={['Kip']} />);
    type('kip');
    enter();
    assert.equal(input().value, '');
  });
});

describe('fridge-search › Removing a chip', () => {
  test('the chip is gone', () => {
    render(<Harness initial={['kip', 'rijst']} />);
    fireEvent.click(screen.getAllByTestId('IngredientList-remove')[0]!);
    assert.deepEqual(chips(), ['rijst']);
  });

  test('the focus is in the input', () => {
    render(<Harness initial={['kip']} />);
    fireEvent.click(screen.getByTestId('IngredientList-remove'));
    assert.equal(document.activeElement, input());
  });
});

describe('IngredientList', () => {
  test('the label names the input', () => {
    render(<Harness kind="zonder" />);
    assert.equal(screen.getByTestId('IngredientList-label').textContent, 'Liever niet');
    assert.equal(screen.getByTestId('IngredientList-label').getAttribute('for'), input().id);
  });

  test('the buttons of a chip say which entry and list', () => {
    render(<Harness initial={['kip']} />);
    assert.match(screen.getByTestId('IngredientList-remove').getAttribute('aria-label') ?? '', /kip/);
  });

  test('without entries there is no chip list', () => {
    render(<Harness />);
    assert.equal(screen.queryByTestId('IngredientList-chips'), null);
  });
});
