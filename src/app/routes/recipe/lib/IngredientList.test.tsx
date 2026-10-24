import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { IngredientList } from './IngredientList';

describe('IngredientList', () => {
  test('shows the ticks it gets as props', () => {
    render(
      <IngredientList
        ingredients={[
          { quantityText: '4', name: 'appels' },
          { quantityText: '100 g', name: 'suiker' },
        ]}
        ticked={new Set([1])}
        onToggle={() => {}}
      />,
    );
    assert.deepEqual(
      screen.getAllByTestId<HTMLInputElement>('IngredientList-checkbox').map((c) => c.checked),
      [false, true],
    );
  });
});
