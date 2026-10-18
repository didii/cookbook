import { data } from 'react-router';
import { findRecipe } from '~/lib/recipes';
import { tileFor } from '~/lib/tile';
import type { Route } from './+types/route';
import { RecipePage } from './RecipePage';

// Hardcoded sample recipes for now, so the redesigned page can be seen with chips, timers and an oven temperature.
// Back to the database (`getRecipe` in ~/.server/recipes) once StoredRecipe holds the same step data as Recipe.
export function loader({ params }: Route.LoaderArgs) {
  const found = findRecipe(params.slug);
  if (!found) throw data('Recept niet gevonden', { status: 404 });
  const { steps, ...recipe } = found;
  return { recipe, steps, tile: tileFor(recipe.id) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? 'Recept'} · Familiekookboek` }];
}

export default function Recipe({ loaderData }: Route.ComponentProps) {
  const { recipe, steps, tile } = loaderData;
  // Keyed by recipe, so another recipe starts with fresh page state (ticks, marks, timers, cook mode).
  return <RecipePage key={recipe.slug} recipe={recipe} tile={tile} steps={steps} />;
}
