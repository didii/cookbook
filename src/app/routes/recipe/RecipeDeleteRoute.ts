import { data, redirect } from 'react-router';
import { envContext } from '~app/shared/context.server';
import { deletePhoto } from '~app/shared/photos.server';
import { deleteRecipe } from '~app/shared/recipes.server';
import type { Route } from './+types/RecipeDeleteRoute';

/** POST /recepten/:slug/verwijderen: deletes the recipe and its photo, then redirects to the overview. Answers 404 for an unknown recipe. */
export async function action({ params, context }: Route.ActionArgs) {
  const { DB, PHOTOS } = context.get(envContext);
  const deleted = await deleteRecipe(DB, params.slug);
  if (!deleted) throw data('Recept niet gevonden', { status: 404 });
  // After the delete, so a failed photo delete leaves an orphan and never a recipe pointing at a missing file. The recipe is gone either way, so the failure must not turn into an error page.
  // An orphaned photo is an accepted risk; it is logged so it can be found and removed by hand (see the design of delete-recipe).
  if (deleted.image) await deletePhoto(PHOTOS, deleted.image).catch((error: unknown) => console.error('Photo not deleted', deleted.image, error));
  return redirect('/');
}
