import { findRecipe } from '~/lib/recipes';
import { tileFor } from '~/lib/tile';
import { RecipePage } from '../recipe/RecipePage';

export function meta() {
  return [{ title: 'Voorbeeld · Familiekookboek' }];
}

// Dev-only (see routes.ts): the recipe page with the chips the loader cannot deliver yet. Delete when chips are stored.
const { steps, ...recipe } = findRecipe('appeltaart')!;

export default function RecipeDemo() {
  return <RecipePage recipe={recipe} tile={tileFor(recipe.id)} steps={steps} />;
}
