import assert from 'node:assert/strict';
import { useState } from 'react';
import { afterEach, describe, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '~testing/dom';
import { ScaleControl } from './ScaleControl';

afterEach(cleanup);

/** The control holding its own value, like the page does. */
function Harness({ start, servings, seen }: { start: number; servings: boolean; seen: number[] }) {
  const [value, setValue] = useState(start);
  seen.push(value);
  return <ScaleControl value={value} onScaleChange={setValue} servings={servings} />;
}

const field = () => screen.getByTestId<HTMLInputElement>('ScaleControl-field');
const press = (name: 'Meer' | 'Minder') => fireEvent.click(screen.getByTestId(name === 'Meer' ? 'ScaleControl-more' : 'ScaleControl-less'));
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const setup = (start: number, servings: boolean) => {
  const seen: number[] = [];
  render(<Harness start={start} servings={servings} seen={seen} />);
  return seen;
};

describe('recipe-scaling › Control starts at the stored servings', () => {
  test('the field shows the servings', () => {
    setup(4, true);
    assert.equal(field().value, '4');
  });

  test('the label sits above the buttons and names the field', () => {
    setup(4, true);
    const label = screen.getByTestId('ScaleControl-label');
    assert.equal(label.textContent, 'Personen');
    assert.equal(label.getAttribute('for'), field().id);
    assert.ok(label.compareDocumentPosition(screen.getByTestId('ScaleControl-less')) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

describe('recipe-scaling › Plus and minus change by one serving', () => {
  test('plus adds one', () => {
    setup(4, true);
    press('Meer');
    assert.equal(field().value, '5');
  });

  test('minus subtracts one', () => {
    setup(4, true);
    press('Minder');
    assert.equal(field().value, '3');
  });
});

describe('recipe-scaling › Servings do not go below one', () => {
  test('minus at one stays at one', () => {
    setup(1, true);
    press('Minder');
    assert.equal(field().value, '1');
  });
});

describe('recipe-scaling › A typed number is taken over', () => {
  test('the page gets the number and the field keeps it', () => {
    const seen = setup(4, true);
    type('6');
    assert.equal(seen.at(-1), 6);
    assert.equal(field().value, '6');
  });
});

describe('recipe-scaling › Invalid typing is undone', () => {
  for (const bad of ['0', '-2', 'abc', '2,5']) {
    test(`${bad} goes back to the last valid value`, () => {
      const seen = setup(4, true);
      type(bad);
      fireEvent.blur(field());
      assert.equal(field().value, '4');
      assert.equal(seen.at(-1), 4);
    });
  }
});

describe('recipe-scaling › Multiplier starts at one', () => {
  test('the field shows one', () => {
    setup(1, false);
    assert.equal(field().value, '1');
  });

  test('the control shows the times sign', () => {
    setup(1, false);
    assert.ok(screen.getByTestId('ScaleControl-times'));
  });
});

describe('recipe-scaling › Buttons walk the steps', () => {
  const walk = (name: 'Meer' | 'Minder', n: number) =>
    Array.from({ length: n }, () => {
      press(name);
      return field().value;
    });

  test('minus goes down to a tenth', () => {
    setup(1, false);
    assert.deepEqual(walk('Minder', 6), ['1/2', '1/3', '1/4', '1/6', '1/8', '1/10']);
  });

  test('minus stops at a tenth', () => {
    setup(1, false);
    walk('Minder', 6);
    assert.deepEqual(walk('Minder', 1), ['1/10']);
  });

  test('plus goes up', () => {
    setup(1, false);
    assert.deepEqual(walk('Meer', 7), ['1,5', '2', '3', '4', '5', '6', '7']);
  });
});

describe('recipe-scaling › Typed multiplier between steps', () => {
  test('plus goes to the next step above', () => {
    setup(1, false);
    type('2,5');
    press('Meer');
    assert.equal(field().value, '3');
  });

  test('minus goes to the next step below', () => {
    setup(1, false);
    type('2,5');
    press('Minder');
    assert.equal(field().value, '2');
  });
});

describe('recipe-scaling › Typed fraction', () => {
  test('is taken over as a number', () => {
    const seen = setup(1, false);
    type('1/3');
    assert.ok(Math.abs(seen.at(-1)! - 1 / 3) < 1e-9);
  });

  test('is shown as a fraction after leaving the field', () => {
    setup(1, false);
    type('1/3');
    fireEvent.blur(field());
    assert.equal(field().value, '1/3');
  });
});
