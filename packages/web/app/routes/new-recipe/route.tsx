import { data, redirect } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { createRecipe, listAuthors } from '~/.server/recipes';
import { tiles } from '~/lib/tile';
import { RecipeForm } from '~/shared/RecipeForm';
import { readForm, toRecipeFields, validate } from '~/shared/recipeValidation';
import type { Route } from './+types/route';

export async function loader({ context }: Route.LoaderArgs) {
  // The tile is picked here rather than while rendering, so the server and the browser agree.
  return { authors: await listAuthors(context.get(envContext).DB), tile: Math.floor(Math.random() * tiles.length) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const values = readForm(await request.formData());

  const errors = validate(values);
  if (Object.keys(errors).length) return data({ errors, values }, { status: 400 });

  const slug = await createRecipe(context.get(envContext).DB, { ...toRecipeFields(values), createdBy: context.get(userEmailContext) });
  return redirect(`/recepten/${slug}`);
}

export function meta() {
  return [{ title: 'Nieuw recept · Familiekookboek' }];
}

const empty = { title: '', author: '', servings: '', time: '', intro: '', image: '' };

export default function NewRecipe({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <RecipeForm
      heading="Nieuw recept"
      submitLabel="Bewaar recept"
      authors={loaderData.authors}
      tile={loaderData.tile}
      values={actionData?.values ?? empty}
      errors={actionData?.errors ?? {}}
    />
  );
}
