import { data, redirect } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { createRecipe, listAuthors } from '~/.server/recipes';
import { RecipeForm } from '~/shared/RecipeForm';
import { validate, type Field } from '~/shared/recipeValidation';
import type { Route } from './+types/route';

export async function loader({ context }: Route.LoaderArgs) {
  return { authors: await listAuthors(context.get(envContext).DB) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const text = (name: Field) => String(form.get(name) ?? '').trim();
  const values = { title: text('title'), author: text('author'), servings: text('servings') };

  const errors = validate(values);
  if (Object.keys(errors).length) return data({ errors, values }, { status: 400 });

  const slug = await createRecipe(context.get(envContext).DB, {
    title: values.title,
    author: values.author,
    servings: values.servings ? Number(values.servings) : undefined,
    createdBy: context.get(userEmailContext),
  });
  return redirect(`/recepten/${slug}`);
}

export function meta() {
  return [{ title: 'Nieuw recept · Familiekookboek' }];
}

const empty = { title: '', author: '', servings: '' };

export default function NewRecipe({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <RecipeForm
      heading="Nieuw recept"
      submitLabel="Bewaar recept"
      authors={loaderData.authors}
      values={actionData?.values ?? empty}
      errors={actionData?.errors ?? {}}
    />
  );
}
