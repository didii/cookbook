import { data, redirect } from 'react-router';
import { envContext } from '~/.server/context';
import { getRecipe, listAuthors, updateRecipe } from '~/.server/recipes';
import { tileFor } from '~/lib/tile';
import { RecipeForm } from '~/shared/RecipeForm';
import { readForm, toRecipeFields, validate } from '~/shared/recipeValidation';
import type { Route } from './+types/route';

const notFound = () => data('Recept niet gevonden', { status: 404 });

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  const [recipe, authors] = await Promise.all([getRecipe(db, params.slug), listAuthors(db)]);
  if (!recipe) throw notFound();
  const values = {
    title: recipe.title,
    author: recipe.author,
    servings: recipe.servings?.toString() ?? '',
    time: recipe.time ?? '',
    intro: recipe.intro,
    image: recipe.image ?? '',
  };
  return { title: recipe.title, authors, values, tile: tileFor(recipe.id) };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const values = readForm(await request.formData());

  const errors = validate(values);
  if (Object.keys(errors).length) return data({ errors, values }, { status: 400 });

  if (!(await updateRecipe(context.get(envContext).DB, params.slug, toRecipeFields(values)))) throw notFound();
  return redirect(`/recepten/${params.slug}`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.title ?? 'Recept'} bewerken · Familiekookboek` }];
}

export default function EditRecipe({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <RecipeForm
      heading="Recept bewerken"
      submitLabel="Bewaar wijzigingen"
      authors={loaderData.authors}
      tile={loaderData.tile}
      values={actionData?.values ?? loaderData.values}
      errors={actionData?.errors ?? {}}
    />
  );
}
