import { data, redirect } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { acceptImage } from '~/.server/photos';
import { createRecipe, listAuthors } from '~/.server/recipes';
import { emptyContent } from '~/lib/draft';
import { tiles } from '~/lib/tile';
import { RecipeEditor } from '~/shared/recipeEditor/RecipeEditor';
import { readForm, readIngredients, readSteps, toRecipeFields, validate, type Errors } from '~/shared/recipeValidation';
import type { Route } from './+types/route';

export async function loader({ context }: Route.LoaderArgs) {
  // The tile is picked here rather than while rendering, so the server and the browser agree.
  return { authors: await listAuthors(context.get(envContext).DB), tile: Math.floor(Math.random() * tiles.length) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const values = readForm(form);
  const { lines, ingredients, errors: ingredientErrors } = readIngredients(form);
  const { lines: stepLines, steps } = readSteps(form);

  const errors: Errors = validate(values);
  if (Object.keys(ingredientErrors).length) errors.ingredients = ingredientErrors;
  if (Object.keys(errors).length) return data({ errors, values: { ...values, ingredients: lines, steps: stepLines } }, { status: 400 });

  const fields = toRecipeFields(values);
  const slug = await createRecipe(context.get(envContext).DB, {
    ...fields,
    ingredients,
    steps: steps?.map((body) => ({ body })),
    image: acceptImage(fields.image, null),
    createdBy: context.get(userEmailContext),
  });
  return redirect(`/recepten/${slug}`);
}

export function meta() {
  return [{ title: 'Nieuw recept · Familiekookboek' }];
}

export default function NewRecipe({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <RecipeEditor
      heading="Nieuw recept"
      authors={loaderData.authors}
      tile={loaderData.tile}
      initial={emptyContent}
      values={actionData?.values ?? emptyContent}
      errors={actionData?.errors ?? {}}
      cancelTo="/"
    />
  );
}
