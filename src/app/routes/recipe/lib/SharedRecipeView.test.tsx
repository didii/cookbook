import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { describe, test } from 'vitest';
import type { Step } from '~app/shared/recipe';
import { fireEvent, render, screen } from '~testing/dom';
import { scaleIngredient } from './scale/scale';
import { SharedRecipeView } from './SharedRecipeView';

type Recipe = ComponentProps<typeof SharedRecipeView>['recipe'];

const steps: Step[] = [
  { body: 'snijden', ingredients: [] },
  { body: 'bakken', ingredients: [], timer: { minutes: 50 } },
];

const recipe: Recipe = {
  slug: 'appeltaart',
  title: 'Appeltaart',
  author: 'Oma',
  time: '1 uur',
  servings: 4,
  intro: 'Zoet',
  image: '/foto/taart.jpg',
  source: null,
  seal: null,
  tags: ['Hoofdgerecht', 'Winter'],
  ingredients: [
    { quantityText: '4', quantityValue: null, quantityUnit: null, name: 'appels' },
    { quantityText: '100 g', quantityValue: 100, quantityUnit: 'g', name: 'suiker' },
  ],
};

const page = (props: Partial<ComponentProps<typeof SharedRecipeView>> = {}) =>
  render(<SharedRecipeView recipe={recipe} tile={0} steps={steps} {...props} />);

describe('shared-recipe-view › Recipe content', () => {
  test('the head shows title, author, intro and photo', () => {
    page();
    assert.equal(screen.getByTestId('RecipeHead-title').textContent, recipe.title);
    assert.ok(screen.getByTestId('RecipeHead-author'));
    assert.ok(screen.getByTestId('RecipeHead-image'));
  });

  test('a pill for each tag shows', () => {
    page();
    assert.deepEqual(
      screen.getAllByTestId('SharedRecipeView-tag').map((t) => t.textContent),
      recipe.tags,
    );
  });

  test('the ingredients and steps show', () => {
    page();
    assert.equal(screen.getAllByTestId('IngredientList-row').length, recipe.ingredients.length);
    assert.equal(screen.getAllByTestId('StepItem-body').length, steps.length);
  });

  test('the tab bar and cook switch are there', () => {
    page();
    assert.ok(screen.getByTestId('TabBar-list'));
    assert.ok(screen.getByTestId('CookSwitch-text'));
  });
});

describe('shared-recipe-view › Scaling', () => {
  test('doubling the servings changes the ingredient quantities', () => {
    page();
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '8' } });
    assert.equal(screen.getAllByTestId('IngredientList-quantity')[1]!.textContent, scaleIngredient(recipe.ingredients[1]!, 2));
  });
});

describe('shared-recipe-view › No in-app navigation or actions', () => {
  test('there is no link at all', () => {
    page();
    assert.equal(screen.queryAllByRole('link').length, 0);
  });

  test('there is no like button', () => {
    page();
    assert.equal(screen.queryByTestId('LikeButton-leaf'), null);
  });

  test('there is no actions menu', () => {
    page();
    assert.equal(screen.queryByTestId('RecipeActionsMenu-button'), null);
  });

  test('there are no notes', () => {
    page();
    assert.equal(screen.queryByTestId('NotePanel-panel'), null);
    assert.equal(screen.queryByTestId('NoteSheet-root'), null);
  });
});

describe('shared-recipe-view › Tags are not links', () => {
  test('the tags are shown and none is a link', () => {
    page();
    assert.equal(screen.getAllByTestId('SharedRecipeView-tag').length, recipe.tags.length);
    assert.equal(screen.queryAllByRole('link').length, 0);
  });
});

describe('shared-recipe-view › The source link stays', () => {
  test('a web address source is a link to that address', () => {
    page({ recipe: { ...recipe, source: 'https://www.smulweb.nl/recepten/123' } });
    assert.equal(screen.getByTestId('RecipeHead-source').getAttribute('href'), 'https://www.smulweb.nl/recepten/123');
  });
});

describe('shared-recipe-view › Ticking an ingredient', () => {
  test('the ingredient is shown as ticked', () => {
    page();
    const box = screen.getAllByTestId<HTMLInputElement>('IngredientList-checkbox')[0]!;
    fireEvent.click(box);
    assert.equal(screen.getAllByTestId<HTMLInputElement>('IngredientList-checkbox')[0]!.checked, true);
  });
});

describe('shared-recipe-view › Starting a timer', () => {
  test('the timer counts down', async () => {
    page();
    fireEvent.click(screen.getByTestId('TimerChip-start'));
    assert.ok(await screen.findByTestId('TimerChip-countdown'));
  });
});
