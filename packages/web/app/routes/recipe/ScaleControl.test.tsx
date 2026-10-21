import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, fireEvent, render, screen } from '~testing/dom';
import { useState } from 'react';
import { ScaleControl } from './ScaleControl';

afterEach(cleanup);

/** The control holding its own value, like the page does. */
function Harness({ start, servings, seen }: { start: number; servings: boolean; seen: number[] }) {
  const [value, setValue] = useState(start);
  seen.push(value);
  return <ScaleControl value={value} onChange={setValue} servings={servings} />;
}

const field = () => screen.getByTestId<HTMLInputElement>('ScaleControl-field');
const press = (name: 'Meer' | 'Minder') => fireEvent.click(screen.getByTestId(name === 'Meer' ? 'ScaleControl-more' : 'ScaleControl-less'));
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const setup = (start: number, servings: boolean) => {
  const seen: number[] = [];
  render(<Harness start={start} servings={servings} seen={seen} />);
  return seen;
};

test('recipe-scaling › Control starts at the stored servings', () => {
  setup(4, true);
  assert.equal(field().value, '4');
  // The label sits above the buttons and names the field.
  const label = screen.getByTestId('ScaleControl-label');
  assert.equal(label.textContent, 'Personen');
  assert.equal(label.getAttribute('for'), field().id);
  assert.ok(label.compareDocumentPosition(screen.getByTestId('ScaleControl-less')) & Node.DOCUMENT_POSITION_FOLLOWING);
});

test('recipe-scaling › Plus and minus change by one serving', () => {
  setup(4, true);
  press('Meer');
  assert.equal(field().value, '5');
  press('Minder');
  assert.equal(field().value, '4');
  press('Minder');
  assert.equal(field().value, '3');
});

test('recipe-scaling › Servings do not go below one', () => {
  setup(1, true);
  press('Minder');
  assert.equal(field().value, '1');
});

test('recipe-scaling › A typed number is taken over', () => {
  const seen = setup(4, true);
  type('6');
  assert.equal(seen.at(-1), 6);
  assert.equal(field().value, '6');
});

test('recipe-scaling › Invalid typing is undone', () => {
  const seen = setup(4, true);
  for (const bad of ['0', '-2', 'abc', '2,5']) {
    type(bad);
    fireEvent.blur(field());
    assert.equal(field().value, '4');
  }
  assert.equal(seen.at(-1), 4);
});

test('recipe-scaling › Multiplier starts at one', () => {
  setup(1, false);
  assert.equal(field().value, '1');
  assert.ok(screen.getByTestId('ScaleControl-times'));
});

test('recipe-scaling › Buttons walk the steps', () => {
  setup(1, false);
  const walk = (name: 'Meer' | 'Minder', n: number) =>
    Array.from({ length: n }, () => {
      press(name);
      return field().value;
    });
  assert.deepEqual(walk('Minder', 6), ['1/2', '1/3', '1/4', '1/6', '1/8', '1/10']);
  assert.deepEqual(walk('Minder', 1), ['1/10']);
  cleanup();
  setup(1, false);
  assert.deepEqual(walk('Meer', 7), ['1,5', '2', '3', '4', '5', '6', '7']);
});

test('recipe-scaling › Typed multiplier between steps', () => {
  setup(1, false);
  type('2,5');
  press('Meer');
  assert.equal(field().value, '3');
  type('2,5');
  press('Minder');
  assert.equal(field().value, '2');
});

test('recipe-scaling › Typed fraction', () => {
  const seen = setup(1, false);
  type('1/3');
  assert.ok(Math.abs(seen.at(-1)! - 1 / 3) < 1e-9);
  fireEvent.blur(field());
  assert.equal(field().value, '1/3');
});
