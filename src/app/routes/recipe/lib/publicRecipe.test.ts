import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Recipe } from '~app/shared/recipe';
import { publicRecipe } from './publicRecipe';

const chip = { quantityText: '1', quantityValue: 1, quantityValueMax: null, quantityUnit: null, name: 'ei' };
const quantity = { startIndex: 0, endIndex: 1, quantityValue: 1, quantityValueMax: null, maxStartIndex: null, maxEndIndex: null, quantityUnit: null };

/** A recipe with an extra field on every level, as a future column would add. */
const stored = {
  id: 7,
  slug: 'taart',
  updated_at: 'x',
  created_by: 'oma@example.com',
  title: 'Taart',
  author: 'Oma',
  time: null,
  servings: 4,
  intro: '',
  image: null,
  source: null,
  seal: null,
  tags: ['a'],
  ingredients: [{ ...chip, owner: 'oma@example.com' }],
  steps: [
    {
      body: '1 ei',
      ingredients: [{ ...chip, owner: 'x' }],
      quantities: [{ ...quantity, owner: 'x' }],
      timer: { minutes: 5, owner: 'x' },
      owner: 'x',
    },
  ],
} as unknown as Recipe;

describe('publicRecipe', () => {
  test('drops a field it does not list, on the recipe, ingredients, steps, chips, quantities and timers', () => {
    const json = JSON.stringify(publicRecipe(stored));
    for (const dropped of ['owner', 'created_by', 'oma@example.com', 'updated_at', '"id"']) assert.ok(!json.includes(dropped), dropped);
  });

  test('keeps what the page shows', () => {
    const { recipe, steps } = publicRecipe(stored);
    assert.equal(recipe.title, 'Taart');
    assert.equal(recipe.ingredients[0]?.name, 'ei');
    assert.equal(steps[0]?.timer?.minutes, 5);
    assert.equal(steps[0]?.quantities?.length, 1);
  });
});
