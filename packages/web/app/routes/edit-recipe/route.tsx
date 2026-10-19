import { data, redirect } from 'react-router';
import { envContext } from '~/.server/context';
import { acceptImage, deletePhoto } from '~/.server/photos';
import { getRecipe, listAuthors, updateRecipe } from '~/.server/recipes';
import { tileFor } from '~/lib/tile';
import { RecipeEditor } from '~/shared/recipeEditor/RecipeEditor';
import { readForm, readIngredients, toRecipeFields, validate, type Errors } from '~/shared/recipeValidation';
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
  return { slug: params.slug, title: recipe.title, authors, values, tile: tileFor(recipe.id) };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const form = await request.formData();
  const values = readForm(form);
  const { ingredients, errors: ingredientErrors } = readIngredients(form);

  const errors: Errors = validate(values);
  if (Object.keys(ingredientErrors).length) errors.ingredients = ingredientErrors;
  if (Object.keys(errors).length) return data({ errors, values }, { status: 400 });

  const { DB, PHOTOS } = context.get(envContext);
  const fields = toRecipeFields(values);
  const stored = await getRecipe(DB, params.slug);
  const image = stored && acceptImage(fields.image, stored.image);
  const updated = stored && (await updateRecipe(DB, params.slug, { ...fields, image, ingredients }));
  if (!updated) throw notFound();
  // After the write, so a failed delete leaves an orphan and never a recipe pointing at a missing file. The recipe is saved either way, so a failure must not turn into an error page.
  if (updated.previousImage && updated.previousImage !== image) await deletePhoto(PHOTOS, updated.previousImage).catch(() => undefined);
  return redirect(`/recepten/${params.slug}`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.title ?? 'Recept'} bewerken · Familiekookboek` }];
}

export default function EditRecipe({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <RecipeEditor
      key={loaderData.slug}
      heading="Recept bewerken"
      authors={loaderData.authors}
      tile={loaderData.tile}
      initial={loaderData.values}
      values={actionData?.values ?? loaderData.values}
      errors={actionData?.errors ?? {}}
      cancelTo={`/recepten/${loaderData.slug}`}
    />
  );
}
