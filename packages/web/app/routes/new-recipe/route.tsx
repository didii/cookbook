import { data, redirect } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { acceptImage } from '~/.server/photos';
import { chooseSeal, createRecipe, listAuthors } from '~/.server/recipes';
import { emptyContent } from '~/lib/draft';
import { seals } from '~/lib/seals';
import { tiles } from '~/lib/tile';
import { endDraftAfterSave } from '~/shared/recipeEditor/endDraftAfterSave';
import { RecipeEditor } from '~/shared/recipeEditor/RecipeEditor';
import { readForm, readIngredients, readSteps, toRecipeFields, validate, type RecipeFormErrors } from '~/shared/recipeValidation';
import type { Route } from './+types/route';

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  // The tile is picked here rather than while rendering, so the server and the browser agree. The seal is posted back, so the recipe gets the one the editor showed.
  return { authors: await listAuthors(db), tile: Math.floor(Math.random() * tiles.length), seal: await chooseSeal(db) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const values = readForm(form);
  const { lines, ingredients, errors: ingredientErrors } = readIngredients(form);
  const { lines: stepLines, steps } = readSteps(form);

  const errors: RecipeFormErrors = validate(values);
  if (Object.keys(ingredientErrors).length) errors.ingredients = ingredientErrors;
  if (Object.keys(errors).length) return data({ errors, values: { ...values, ingredients: lines, steps: stepLines } }, { status: 400 });

  const fields = toRecipeFields(values);
  const slug = await createRecipe(context.get(envContext).DB, {
    ...fields,
    ingredients,
    steps,
    image: acceptImage(fields.image, null),
    seal: seals.find((s) => s === form.get('seal')),
    createdBy: context.get(userEmailContext),
  });
  return redirect(`/recepten/${slug}`);
}

/** Ends the draft when the save succeeds (see `endDraftAfterSave`). */
export const clientAction = ({ request, serverAction }: Route.ClientActionArgs) => endDraftAfterSave({ request, serverAction });

export function meta() {
  return [{ title: 'Nieuw recept · Familiekookboek' }];
}

export default function NewRecipe({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <RecipeEditor
      heading="Nieuw recept"
      authors={loaderData.authors}
      tile={loaderData.tile}
      seal={loaderData.seal}
      initial={emptyContent}
      values={actionData?.values ?? emptyContent}
      errors={actionData?.errors ?? {}}
      cancelTo="/"
    />
  );
}
