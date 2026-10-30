import assert from 'node:assert/strict';
import { describe, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '~testing/dom';
import { MissingIngredients } from './MissingIngredients';

const show = (names: string[], onHave = vi.fn(), onSkip = vi.fn()) => {
  render(<MissingIngredients names={names} onHave={onHave} onSkip={onSkip} />);
  return { onHave, onSkip };
};
const rows = () => screen.queryAllByTestId('MissingIngredients-name').map((n) => n.textContent);

describe('fridge-search › Missing ingredients', () => {
  test('the rows are the ingredients in recipe order', () => {
    show(['melk', 'kaneel']);
    assert.deepEqual(rows(), ['melk', 'kaneel']);
  });

  test('the section has a heading', () => {
    show(['melk']);
    assert.ok(screen.getByTestId('MissingIngredients-heading').textContent);
  });

  test('a row has a button to have it and one to skip it, each naming the ingredient', () => {
    show(['melk']);
    assert.match(screen.getByTestId('MissingIngredients-have').getAttribute('aria-label') ?? '', /melk/);
    assert.match(screen.getByTestId('MissingIngredients-skip').getAttribute('aria-label') ?? '', /melk/);
  });

  test('the + calls onHave with the name', () => {
    const { onHave, onSkip } = show(['melk', 'kaneel']);
    fireEvent.click(within(screen.getAllByTestId('MissingIngredients-row')[1]!).getByTestId('MissingIngredients-have'));
    assert.deepEqual(onHave.mock.calls, [['kaneel']]);
    assert.equal(onSkip.mock.calls.length, 0);
  });

  test('the − calls onSkip with the name', () => {
    const { onHave, onSkip } = show(['melk', 'kaneel']);
    fireEvent.click(within(screen.getAllByTestId('MissingIngredients-row')[0]!).getByTestId('MissingIngredients-skip'));
    assert.deepEqual(onSkip.mock.calls, [['melk']]);
    assert.equal(onHave.mock.calls.length, 0);
  });

  test('five ingredients show no more button', () => {
    show(['a', 'b', 'c', 'd', 'e']);
    assert.equal(screen.queryByTestId('MissingIngredients-more'), null);
  });
});

describe('fridge-search › Many missing ingredients', () => {
  const seven = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  test('five rows are listed', () => {
    show(seven);
    assert.deepEqual(rows(), seven.slice(0, 5));
  });

  test('a button says how many are left', () => {
    show(seven);
    assert.equal(screen.getByTestId('MissingIngredients-more').textContent, '+2 meer');
  });

  test('pressing it lists all seven', () => {
    show(seven);
    fireEvent.click(screen.getByTestId('MissingIngredients-more'));
    assert.deepEqual(rows(), seven);
  });

  test('the button is gone afterwards', () => {
    show(seven);
    fireEvent.click(screen.getByTestId('MissingIngredients-more'));
    assert.equal(screen.queryByTestId('MissingIngredients-more'), null);
  });
});

describe('fridge-search › Nothing missing', () => {
  test('there is no heading and no list', () => {
    show([]);
    assert.equal(screen.queryByTestId('MissingIngredients-section'), null);
  });
});
