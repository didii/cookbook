import { data } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { getMemberRecipeData, getRecipe, recordView } from '~app/shared/recipes.server';
import { tileFor } from '~app/shared/tile';
import type { Route } from './+types/RecipePageRoute';
import { RecipeView } from './lib/RecipeView';

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  const found = await getRecipe(db, params.slug);
  if (!found) throw data('Recept niet gevonden', { status: 404 });
  // Opening the page ends the recipe's "Nieuw" marker for this member. Idempotent, so a GET may do it.
  const email = context.get(userEmailContext);
  await recordView(db, email, params.slug);
  const { steps, ...recipe } = found;
  return { recipe, steps, tile: tileFor(recipe.id), ...(await getMemberRecipeData(db, email, params.slug)) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? 'Recept'} · Familiekookboek` }];
}

export default function RecipePage({ loaderData }: Route.ComponentProps) {
  const { recipe, steps, tile, liked, note } = loaderData;
  // Keyed by recipe, so another recipe starts with fresh page state (ticks, marks, timers, cook mode).
  return <RecipeView key={recipe.slug} recipe={recipe} tile={tile} steps={steps} liked={liked} note={note} />;
}
