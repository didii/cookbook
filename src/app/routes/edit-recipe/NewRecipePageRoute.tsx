import { data, redirect, useRouteLoaderData } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { acceptImage } from '~app/shared/photos.server';
import { chooseSeal, createRecipe, listAuthors } from '~app/shared/recipes.server';
import { readForm, readIngredients, readSteps, toRecipeFields, validate, type RecipeFormErrors } from '~app/shared/recipeValidation';
import { defaultRules, type Rules } from '~app/shared/rules';
import { getRules } from '~app/shared/rules.server';
import { seals } from '~app/shared/seals';
import { tiles } from '~app/shared/tile';
import { getUser } from '~app/shared/users.server';
import type { Route } from './+types/NewRecipePageRoute';
import { emptyDraftSeed } from './lib/draft';
import { endDraftAfterSave } from './lib/endDraftAfterSave';
import { RecipeEditor } from './lib/RecipeEditor';

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  // The author field starts as the member's calling name; the welcome gate means there is a user (empty only when it is bypassed).
  const callingName = (await getUser(db, context.get(userEmailContext)))?.callingName ?? '';
  // The tile is picked here rather than while rendering, so the server and the browser agree. The seal is posted back, so the recipe gets the one the editor showed.
  return { callingName, authors: await listAuthors(db), tile: Math.floor(Math.random() * tiles.length), seal: await chooseSeal(db) };
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const values = readForm(form);
  const { lines, ingredients, errors: ingredientErrors } = readIngredients(form, await getRules(context.get(envContext).DB));
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

export default function NewRecipePage({ loaderData, actionData }: Route.ComponentProps) {
  const seed = { ...emptyDraftSeed, author: loaderData.callingName };
  return (
    <RecipeEditor
      rules={useRouteLoaderData<{ rules?: Rules }>('root')?.rules ?? defaultRules}
      heading="Nieuw recept"
      authors={loaderData.authors}
      tile={loaderData.tile}
      seal={loaderData.seal}
      initial={seed}
      values={actionData?.values ?? seed}
      errors={actionData?.errors ?? {}}
      cancelTo="/"
    />
  );
}
