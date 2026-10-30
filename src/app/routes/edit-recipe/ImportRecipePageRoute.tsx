import type { Route } from './+types/ImportRecipePageRoute';
import { NewRecipeForm } from './lib/NewRecipeForm';

// The same loader and action as a new recipe: the import only prefills the form, so a save is the same save.
export { action, clientAction, loader } from './NewRecipePageRoute';

export function meta() {
  return [{ title: 'Recept importeren · Familiekookboek' }];
}

export default function ImportRecipePage({ loaderData, actionData }: Route.ComponentProps) {
  return <NewRecipeForm loaderData={loaderData} actionData={actionData} heading="Recept importeren" canImport />;
}
