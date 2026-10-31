import type { Recipe } from '~app/shared/recipe';
import type { DraftSeed } from './draft';
import { joinIngredient } from './shared/ingredients';

/** What the editor starts with for a stored recipe: the edit page shows it, and so does a copy. */
export function recipeSeed(recipe: Recipe): DraftSeed {
  return {
    title: recipe.title,
    author: recipe.author,
    servings: recipe.servings?.toString() ?? '',
    time: recipe.time ?? '',
    intro: recipe.intro,
    image: recipe.image ?? '',
    source: recipe.source ?? '',
    ingredients: recipe.ingredients.map((i) => joinIngredient({ quantityText: i.quantityText, name: i.name })),
    // The editor types the text; stored amounts would go stale and are found again on save.
    steps: recipe.steps.map(({ body, ingredients, ovenTemperature, timer }) => ({ body, ingredients, ovenTemperature, timer })),
    tags: recipe.tags,
  };
}
