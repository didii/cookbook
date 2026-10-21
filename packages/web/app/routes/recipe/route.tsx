import { data, redirect } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { deletePhoto } from '~/.server/photos';
import { deleteRecipe, getRecipe, recordView } from '~/.server/recipes';
import { tileFor } from '~/lib/tile';
import type { Route } from './+types/route';
import { RecipePage } from './RecipePage';

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  const found = await getRecipe(db, params.slug);
  if (!found) throw data('Recept niet gevonden', { status: 404 });
  // Opening the page ends the recipe's "Nieuw" marker for this member. Idempotent, so a GET may do it.
  await recordView(db, context.get(userEmailContext), params.slug);
  const { steps, ...recipe } = found;
  return { recipe, steps, tile: tileFor(recipe.id) };
}

export async function action({ params, context }: Route.ActionArgs) {
  const { DB, PHOTOS } = context.get(envContext);
  const deleted = await deleteRecipe(DB, params.slug);
  if (!deleted) throw data('Recept niet gevonden', { status: 404 });
  // After the delete, so a failed photo delete leaves an orphan and never a recipe pointing at a missing file; the recipe is gone either way.
  if (deleted.image) await deletePhoto(PHOTOS, deleted.image).catch(() => undefined);
  return redirect('/');
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.recipe.title ?? 'Recept'} · Familiekookboek` }];
}

export default function Recipe({ loaderData }: Route.ComponentProps) {
  const { recipe, steps, tile } = loaderData;
  // Keyed by recipe, so another recipe starts with fresh page state (ticks, marks, timers, cook mode).
  return <RecipePage key={recipe.slug} recipe={recipe} tile={tile} steps={steps} />;
}
