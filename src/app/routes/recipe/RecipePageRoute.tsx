import { data, redirect, useRouteLoaderData } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { deletePhoto } from '~app/shared/photos.server';
import { deleteRecipe, getMemberRecipeData, getRecipe, recordView } from '~app/shared/recipes.server';
import { defaultRules, type Rules } from '~app/shared/rules';
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

export async function action({ params, context }: Route.ActionArgs) {
  const { DB, PHOTOS } = context.get(envContext);
  const deleted = await deleteRecipe(DB, params.slug);
  if (!deleted) throw data('Recept niet gevonden', { status: 404 });
  // After the delete, so a failed photo delete leaves an orphan and never a recipe pointing at a missing file. The recipe is gone either way, so the failure must not turn into an error page.
  // An orphaned photo is an accepted risk; it is logged so it can be found and removed by hand (see the design of delete-recipe).
  if (deleted.image) await deletePhoto(PHOTOS, deleted.image).catch((error: unknown) => console.error('Photo not deleted', deleted.image, error));
  return redirect('/');
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? 'Recept'} · Familiekookboek` }];
}

export default function RecipePage({ loaderData }: Route.ComponentProps) {
  const { recipe, steps, tile, liked, note } = loaderData;
  const rules = useRouteLoaderData<{ rules: Rules }>('root')?.rules ?? defaultRules;
  // Keyed by recipe, so another recipe starts with fresh page state (ticks, marks, timers, cook mode).
  return <RecipeView key={recipe.slug} recipe={recipe} tile={tile} steps={steps} rules={rules} liked={liked} note={note} />;
}
