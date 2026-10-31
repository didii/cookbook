import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Recipe } from '~app/shared/recipe';
import { fake } from '~testing/fake';
import { recipeSeed } from './recipeSeed';

const recipe = fake<Recipe>({
  title: 'Soep',
  author: 'Oma',
  servings: 4,
  time: '1u',
  intro: 'Warm',
  image: '/foto/x.jpg',
  source: 'Libelle',
  tags: ['Soep'],
  ingredients: [{ quantityText: '250 g', name: 'bloem' }],
  steps: [{ body: 'Roeren', ingredients: [], ovenTemperature: 180, timer: undefined, quantities: [] }],
});

describe('recipeSeed', () => {
  test('maps the fields to the form texts', () => {
    const { ingredients, steps, ...rest } = recipeSeed(recipe);
    assert.deepEqual(rest, {
      title: 'Soep',
      author: 'Oma',
      servings: '4',
      time: '1u',
      intro: 'Warm',
      image: '/foto/x.jpg',
      source: 'Libelle',
      tags: ['Soep'],
    });
    assert.deepEqual(ingredients, ['250 g bloem']);
    assert.deepEqual(steps, [{ body: 'Roeren', ingredients: [], ovenTemperature: 180, timer: undefined }]);
  });

  test('turns missing optional values into empty texts', () => {
    const seed = recipeSeed({ ...recipe, servings: null, time: null, image: null, source: null });
    assert.deepEqual([seed.servings, seed.time, seed.image, seed.source], ['', '', '', '']);
  });
});
