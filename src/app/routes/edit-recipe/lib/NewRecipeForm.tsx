import { useRouteLoaderData } from 'react-router';
import { defaultRules, type Rules } from '~app/shared/rules';
import { emptyDraftSeed, type DraftSeed } from './draft';
import { RecipeEditor } from './RecipeEditor';
import type { RecipeFormErrors } from './recipeValidation';

interface NewRecipeFormProps {
  /** What the loader of a new recipe page gives. */
  loaderData: { callingName: string; authors: string[]; tags: string[]; tagCategories?: Record<string, string>; tile: number; seal?: string };
  /** What a refused submit hands back (nothing on first opening). */
  actionData?: { errors: RecipeFormErrors; values: DraftSeed };
  heading: string;
  /** Offer to fill the form from a web address. */
  canImport?: boolean;
}

/** The editor for a new recipe, started with the member's calling name as author; the new recipe page and the import page both show it. */
export function NewRecipeForm({ loaderData, actionData, heading, canImport }: NewRecipeFormProps) {
  const seed = { ...emptyDraftSeed, author: loaderData.callingName };
  return (
    <RecipeEditor
      rules={useRouteLoaderData<{ rules?: Rules }>('root')?.rules ?? defaultRules}
      heading={heading}
      canImport={canImport}
      authors={loaderData.authors}
      tags={loaderData.tags}
      tagCategories={loaderData.tagCategories}
      tile={loaderData.tile}
      seal={loaderData.seal}
      initial={seed}
      values={actionData?.values ?? seed}
      errors={actionData?.errors ?? {}}
      cancelTo="/"
    />
  );
}
