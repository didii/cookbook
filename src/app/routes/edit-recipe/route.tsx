import { data, redirect, useRouteLoaderData } from 'react-router';
import { envContext } from '~app/.server/context';
import { acceptImage, deletePhoto } from '~app/.server/photos';
import { getRecipe, listAuthors, updateRecipe } from '~app/.server/recipes';
import { getRules } from '~app/.server/rules';
import { joinIngredient } from '~app/lib/ingredients';
import { defaultRules, type Rules } from '~app/lib/rules';
import { tileFor } from '~app/lib/tile';
import { endDraftAfterSave } from '~app/shared/recipeEditor/endDraftAfterSave';
import { RecipeEditor } from '~app/shared/recipeEditor/RecipeEditor';
import { readForm, readIngredients, readSteps, toRecipeFields, validate, type RecipeFormErrors } from '~app/shared/recipeValidation';
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
    ingredients: recipe.ingredients.map((i) => joinIngredient({ quantityText: i.quantityText, name: i.name })),
    steps: recipe.steps,
  };
  return {
    slug: params.slug,
    title: recipe.title,
    authors,
    values,
    tile: tileFor(recipe.id),
    seal: recipe.seal ?? undefined,
    updatedAt: recipe.updated_at,
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const form = await request.formData();
  const values = readForm(form);
  const { lines, ingredients, errors: ingredientErrors } = readIngredients(form, await getRules(context.get(envContext).DB));
  const { lines: stepLines, steps } = readSteps(form);

  const errors: RecipeFormErrors = validate(values);
  if (Object.keys(ingredientErrors).length) errors.ingredients = ingredientErrors;
  if (Object.keys(errors).length) return data({ errors, values: { ...values, ingredients: lines, steps: stepLines } }, { status: 400 });

  const { DB, PHOTOS } = context.get(envContext);
  const fields = toRecipeFields(values);
  const stored = await getRecipe(DB, params.slug);
  const image = stored && acceptImage(fields.image, stored.image);
  const updated = stored && (await updateRecipe(DB, params.slug, { ...fields, image, ingredients, steps }));
  if (!updated) throw notFound();
  // After the write, so a failed delete leaves an orphan and never a recipe pointing at a missing file. The recipe is saved either way, so a failure must not turn into an error page.
  if (updated.previousImage && updated.previousImage !== image) await deletePhoto(PHOTOS, updated.previousImage).catch(() => undefined);
  return redirect(`/recepten/${params.slug}`);
}

/** Ends the draft when the save succeeds (see `endDraftAfterSave`). */
export const clientAction = ({ request, serverAction }: Route.ClientActionArgs) => endDraftAfterSave({ request, serverAction });

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.title ?? 'Recept'} bewerken · Familiekookboek` }];
}

export default function EditRecipe({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <RecipeEditor
      rules={useRouteLoaderData<{ rules?: Rules }>('root')?.rules ?? defaultRules}
      key={loaderData.slug}
      slug={loaderData.slug}
      updatedAt={loaderData.updatedAt}
      heading="Recept bewerken"
      authors={loaderData.authors}
      tile={loaderData.tile}
      seal={loaderData.seal}
      initial={loaderData.values}
      values={actionData?.values ?? loaderData.values}
      errors={actionData?.errors ?? {}}
      cancelTo={`/recepten/${loaderData.slug}`}
    />
  );
}
