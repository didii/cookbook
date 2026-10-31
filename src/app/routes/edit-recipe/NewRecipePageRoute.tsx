import { data, redirect } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { acceptImage, copyPhoto } from '~app/shared/photos.server';
import { chooseSeal, createRecipe, getRecipe, isImageUsed, listAuthors } from '~app/shared/recipes.server';
import { getRules } from '~app/shared/rules.server';
import { seals } from '~app/shared/seals';
import { listManagedTags } from '~app/shared/tagManagement.server';
import { categoriesOf, sortTags } from '~app/shared/tags';
import { tiles } from '~app/shared/tile';
import { getUser } from '~app/shared/users.server';
import type { Route } from './+types/NewRecipePageRoute';
import { emptyDraftSeed } from './lib/draft';
import { endDraftAfterSave } from './lib/endDraftAfterSave';
import { NewRecipeForm } from './lib/NewRecipeForm';
import { recipeSeed } from './lib/recipeSeed';
import { readForm, readIngredients, readSteps, readTags, tagError, toRecipeFields, validate, type RecipeFormErrors } from './lib/recipeValidation';

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  const managed = await listManagedTags(db);
  // `kopie=<slug>` starts the form as a copy of that recipe; an unknown slug gives the empty form. Nothing is written.
  const copyOf = new URL(request.url).searchParams.get('kopie');
  const original = copyOf ? await getRecipe(db, copyOf) : undefined;
  // The author field starts as the member's calling name; the welcome gate means there is a user (empty only when it is bypassed).
  const callingName = (await getUser(db, context.get(userEmailContext)))?.callingName ?? '';
  // The tile is picked here rather than while rendering, so the server and the browser agree. The seal is posted back, so the recipe gets the one the editor showed.
  return {
    seed: original ? recipeSeed(original) : { ...emptyDraftSeed, author: callingName },
    authors: await listAuthors(db),
    tags: sortTags(managed.map((t) => t.name)),
    tagCategories: categoriesOf(managed),
    tile: Math.floor(Math.random() * tiles.length),
    seal: await chooseSeal(db),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const values = readForm(form);
  const rules = await getRules(context.get(envContext).DB);
  const { lines, ingredients, errors: ingredientErrors } = readIngredients(form, rules);
  const { lines: stepLines, steps, errors: stepErrors } = readSteps(form, ingredients ?? [], rules);

  const tags = readTags(form);
  const errors: RecipeFormErrors = validate(values);
  const tooLong = tagError(tags);
  if (tooLong) errors.tags = tooLong;
  if (Object.keys(ingredientErrors).length) errors.ingredients = ingredientErrors;
  if (Object.keys(stepErrors).length) errors.steps = stepErrors;
  if (Object.keys(errors).length)
    return data({ errors, values: { ...values, ingredients: lines, steps: stepLines, tags: tags ?? [] } }, { status: 400 });

  const fields = toRecipeFields(values);
  const { DB, PHOTOS } = context.get(envContext);
  let image = acceptImage(fields.image, null);
  // A photo file belongs to one recipe: a copy gets its own file, and is saved without a photo when that fails.
  if (image && (await isImageUsed(DB, image))) image = await copyPhoto(PHOTOS, image).catch(() => undefined);
  const slug = await createRecipe(DB, {
    ...fields,
    ingredients,
    steps,
    tags,
    image,
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

export default function NewRecipePage({ loaderData, actionData }: Route.ComponentProps) {
  return <NewRecipeForm loaderData={loaderData} actionData={actionData} heading="Nieuw recept" />;
}
