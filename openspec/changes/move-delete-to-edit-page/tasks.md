# Tasks

Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec move-delete-to-edit-page` lists the delta scenarios still without a test.

## 1. Delete action

- [x] 1.1 Add `routes/recipe/RecipeDeleteRoute.ts` (the action from `RecipePageRoute`, unchanged) and the route `recepten/:slug/verwijderen` in `routes.ts`; remove the action and its imports from `RecipePageRoute.tsx`. Move the "Recipe is deleted", "Photo is deleted" and "Unknown recipe" tests from `RecipePageRoute.test.ts` to `RecipeDeleteRoute.test.ts`, the action tests calling the new action.

## 2. Button

- [x] 2.1 Move `DeleteRecipe.tsx` and its test from `routes/recipe/lib` to `routes/edit-recipe/lib`; add a `slug` prop for the form's `action`. Keep the popup scenarios' `describe`s.
- [x] 2.2 Render `DeleteRecipe` in `RecipeEditor` after the form, only when `slug` is set; remove it from `RecipeView` (and its wrapper `div` and test references). Test "Delete button is shown" and "No delete button for a new recipe" in `RecipeEditor.test.tsx`, and "No delete button on the recipe page" in `RecipeView.test.tsx`.

## 3. Wrap-up

- [ ] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec move-delete-to-edit-page`; all clean.
