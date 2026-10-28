# Tasks

## 1. Storage

- [x] 1.1 Add `src/db/migrations/0017_recipe_source.sql` (nullable `source` with the 500 `CHECK`); `pnpm test:ai` passes the "recipe-source › Source over the limit is refused by the database" test in `migrations.test.ts`, and existing rows still read back
- [x] 1.2 Add `source` to `Recipe` (`shared/recipe.ts`) and to `getRecipe`, `createRecipe`, `updateRecipe` and `RecipeInput` in `recipes.server.ts`, storing blank as null; `recipes.server.test.ts` covers the "Source is saved" and "No source" scenarios

## 2. Form

- [x] 2.1 Add `source` to `RecipeFormField`, `readForm`, `toRecipeFields`, and a `maxSourceLength` (500) check with message in `recipeValidation.ts`; `recipeValidation.test.ts` covers trimming, the limit and the message
- [x] 2.2 Use the check in `NewRecipePageRoute.tsx` and `EditRecipePageRoute.tsx` and pass the stored source to the edit form; the route tests cover save, clear, at-limit and over-limit
- [x] 2.3 Add `source` to the draft state (`draft.ts`) and accept drafts without it in `draftStore.ts`; `draft.test.ts` and `draftStore.test.ts` cover the draft, reset and an old draft
- [x] 2.4 Add the "Bron" field (hint, `maxLength`, error) under the author in `RecipeEditor.tsx`; `RecipeEditor.test.tsx` covers its place, optional, stored value and error

## 3. View and seed

- [x] 3.1 Add the pure function that tells a link source from text, beside `RecipeView`; its unit test covers http, https, `javascript:`, `ftp:`, whitespace and a non-URL
- [x] 3.2 Show the source in `RecipeView.tsx` (link with host text, `target="_blank"`, `rel="noopener noreferrer"`, or plain text, nothing without one); `RecipeView.test.tsx` covers the "The recipe page shows the source" scenarios
- [ ] 3.3 Give one seed recipe a text source and another a link in `src/db/seed/dev.sql`; `src/db/seed/dev.test.ts` passes

## 4. Finish

- [ ] 4.1 `pnpm test:spec record-recipe-source` shows no scenario without a test; run `pnpm format:fix` and `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai` all pass
