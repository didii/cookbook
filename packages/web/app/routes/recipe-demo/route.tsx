import { appeltaartSteps } from '~testing/steps';
import { findRecipe } from '~/lib/recipes';
import { tileFor } from '~/lib/tile';
import { RecipePage } from '../recipe/RecipePage';

export function meta() {
  return [{ title: 'Voorbeeld · Familiekookboek' }];
}

// Dev-only (see routes.ts): the recipe page with the chips the loader cannot deliver yet. Delete when chips are stored.
const sample = findRecipe('appeltaart')!;
const recipe = {
  id: 1,
  slug: sample.slug,
  title: sample.title,
  author: sample.by,
  time: sample.time,
  servings: sample.servings,
  intro: sample.intro,
  image: sample.image,
  seal: sample.seal,
  ingredients: sample.ingredients.map((i) => ({ quantity_text: i.q, name: i.item })),
  steps: appeltaartSteps.map((s) => s.body),
};

export default function RecipeDemo() {
  return <RecipePage recipe={recipe} tile={tileFor(recipe.id)} steps={appeltaartSteps} />;
}
