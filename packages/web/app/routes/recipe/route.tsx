import { useMemo } from 'react';
import { data } from 'react-router';
import { envContext } from '~/.server/context';
import { getRecipe } from '~/.server/recipes';
import { toSteps } from '~/lib/steps';
import { tileFor } from '~/lib/tile';
import type { Route } from './+types/route';
import { RecipePage } from './RecipePage';

export async function loader({ params, context }: Route.LoaderArgs) {
  const recipe = await getRecipe(context.get(envContext).DB, params.slug);
  if (!recipe) throw data('Recept niet gevonden', { status: 404 });
  return { recipe, tile: tileFor(recipe.id) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? 'Recept'} · Familiekookboek` }];
}

export default function Recipe({ loaderData }: Route.ComponentProps) {
  const { recipe, tile } = loaderData;
  // A stable array: the timers read their definitions from it.
  const steps = useMemo(() => toSteps(recipe.steps), [recipe.steps]);
  // Keyed by recipe, so another recipe starts with fresh page state (ticks, marks, timers, cook mode).
  return <RecipePage key={recipe.slug} recipe={recipe} tile={tile} steps={steps} />;
}
