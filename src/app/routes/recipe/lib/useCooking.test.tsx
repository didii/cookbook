import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Recipe, Step } from '~app/shared/recipe';
import { fireEvent, render, screen } from '~testing/dom';
import { scaleIngredient } from './scale/scale';
import { useCooking } from './useCooking';

const recipe: Pick<Recipe, 'slug' | 'servings' | 'ingredients'> = {
  slug: 'appeltaart',
  servings: 4,
  ingredients: [{ quantityText: '100 g', quantityValue: 100, quantityUnit: 'g', name: 'suiker' }],
};
const steps: Step[] = [{ body: 'snijden', ingredients: [] }];

/** Shows what the hook returns and gives a button for each way of changing it. */
function Probe() {
  const c = useCooking(recipe, steps);
  return (
    <>
      <span data-testid="Probe-tab">{c.tab}</span>
      <span data-testid="Probe-ticked">{[...c.ticked].join(',')}</span>
      <span data-testid="Probe-quantity">{c.scaled.ingredients[0]?.quantityText}</span>
      <button aria-label="x" data-testid="Probe-steps" onClick={() => c.select('steps')} />
      <button aria-label="x" data-testid="Probe-tick" onClick={() => c.toggleTicked(0)} />
      <button aria-label="x" data-testid="Probe-double" onClick={() => c.setAmount(8)} />
    </>
  );
}

const text = (id: string) => screen.getByTestId(id).textContent;

describe('useCooking', () => {
  test('starts on the ingredients tab', () => {
    render(<Probe />);
    assert.equal(text('Probe-tab'), 'ingredients');
  });

  test('select opens the other tab and puts it in the hash', () => {
    render(<Probe />);
    fireEvent.click(screen.getByTestId('Probe-steps'));
    assert.equal(text('Probe-tab'), 'steps');
    assert.equal(location.hash, '#steps');
  });

  test('toggleTicked ticks an ingredient and a second call unticks it', () => {
    render(<Probe />);
    fireEvent.click(screen.getByTestId('Probe-tick'));
    assert.equal(text('Probe-ticked'), '0');
    fireEvent.click(screen.getByTestId('Probe-tick'));
    assert.equal(text('Probe-ticked'), '');
  });

  test('setAmount scales the quantities', () => {
    render(<Probe />);
    fireEvent.click(screen.getByTestId('Probe-double'));
    assert.equal(text('Probe-quantity'), scaleIngredient(recipe.ingredients[0]!, 2));
  });
});
