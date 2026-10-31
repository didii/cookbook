import { data } from 'react-router';
import { envContext } from '~app/shared/context.server';
import { getRecipe } from '~app/shared/recipes.server';
import { tileFor } from '~app/shared/tile';
import type { Route } from './+types/SharePageRoute';
import { publicRecipe } from './lib/publicRecipe';
import { SharedRecipeView } from './lib/SharedRecipeView';

/** The public page of a recipe. Public: no member is read and no view is recorded. */
export async function loader({ params, context }: Route.LoaderArgs) {
  const found = await getRecipe(context.get(envContext).DB, params.slug);
  if (!found) throw data('Recept niet gevonden', { status: 404 });
  const { recipe, steps } = publicRecipe(found);
  return { recipe, steps, tile: tileFor(found.id) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? 'Recept'} · Familiekookboek` }];
}

export default function SharePage({ loaderData }: Route.ComponentProps) {
  const { recipe, steps, tile } = loaderData;
  return <SharedRecipeView key={recipe.slug} recipe={recipe} tile={tile} steps={steps} />;
}
