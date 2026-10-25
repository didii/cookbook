import { data, redirect, useRouteLoaderData } from 'react-router';
import { envContext } from '~app/shared/context.server';
import { acceptImage, deletePhoto } from '~app/shared/photos.server';
import { getRecipe, listAuthors, updateRecipe } from '~app/shared/recipes.server';
import { defaultRules, type Rules } from '~app/shared/rules';
import { getRules } from '~app/shared/rules.server';
import { tileFor } from '~app/shared/tile';
import type { Route } from './+types/EditRecipePageRoute';
import { endDraftAfterSave } from './lib/endDraftAfterSave';
import { RecipeEditor } from './lib/RecipeEditor';
import { readForm, readIngredients, readSteps, readTags, tagError, toRecipeFields, validate, type RecipeFormErrors } from './lib/recipeValidation';
import { joinIngredient } from './lib/shared/ingredients';

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
    // The editor types the text; stored amounts would go stale and are found again on save.
    steps: recipe.steps.map(({ body, ingredients, ovenTemperature, timer }) => ({ body, ingredients, ovenTemperature, timer })),
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
  const { DB, PHOTOS } = context.get(envContext);
  const rules = await getRules(DB);
  const stored = await getRecipe(DB, params.slug);
  const { lines, ingredients, errors: ingredientErrors } = readIngredients(form, rules);
  // A form without an ingredient list keeps the stored ingredients, so the amounts in the steps are found against those.
  const { lines: stepLines, steps } = readSteps(form, ingredients ?? stored?.ingredients ?? [], rules);

  const tags = readTags(form);
  const errors: RecipeFormErrors = validate(values);
  const tooLong = tagError(tags);
  if (tooLong) errors.tags = tooLong;
  if (Object.keys(ingredientErrors).length) errors.ingredients = ingredientErrors;
  if (Object.keys(errors).length)
    return data({ errors, values: { ...values, ingredients: lines, steps: stepLines, tags: tags ?? [] } }, { status: 400 });

  const fields = toRecipeFields(values);
  const image = stored && acceptImage(fields.image, stored.image);
  const updated = stored && (await updateRecipe(DB, params.slug, { ...fields, image, ingredients, steps, tags }));
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

export default function EditRecipePage({ loaderData, actionData }: Route.ComponentProps) {
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
