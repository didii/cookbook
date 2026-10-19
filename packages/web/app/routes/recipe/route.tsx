import { data } from 'react-router';
import { envContext } from '~/.server/context';
import { getRecipe } from '~/.server/recipes';
import { tileFor } from '~/lib/tile';
import type { Route } from './+types/route';
import { RecipePage } from './RecipePage';

export async function loader({ params, context }: Route.LoaderArgs) {
  const found = await getRecipe(context.get(envContext).DB, params.slug);
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
