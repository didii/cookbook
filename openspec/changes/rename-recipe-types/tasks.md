# Tasks

Precondition: `home-recipes-from-db` is merged. Each task is a rename only; verify with `pnpm typecheck` (or the package's type-check script) and `pnpm test:ai` passing unchanged.

## 1. Domain model in one file

- [x] 1.1 `git mv lib/recipes.ts lib/recipe.ts`, update all imports; verify type check and `pnpm test:ai` pass
- [x] 1.2 Add `Recipe` to `lib/recipe.ts` (replaces `StoredRecipe`; rename all users incl. `getRecipe`, `RecipePage`, `IngredientList`, tests); verify no `StoredRecipe` remains (`grep`) and tests pass
- [x] 1.2b Move `RecipeSummary` from `.server/recipes.ts` to `lib/recipe.ts` as a standalone type (not a `Pick` of `Recipe`); point `RecipeCard`, `home/route.tsx` and `listRecipes` at it; verify home tests pass
- [x] 1.3 Make `.server/recipes.ts` hold only rows, queries and the row-to-`Recipe` mapping; verify `RecipeCard` and other browser code import nothing type-wise from `.server`

## 2. Write input

- [x] 2.1 Rename `NewRecipe` / `RecipeUpdate` to `RecipeInput` (update as a `Pick`), and settle `NewStep`; verify no old names remain and tests pass

## 3. Form

- [x] 3.1 Rename `Values` / `Field` / `Errors` in `shared/recipeValidation.ts` to `RecipeForm` / `RecipeFormField` / `RecipeFormErrors` with all users; verify with type check and tests
- [x] 3.2 Rename `Values` in `lib/chips.ts` to `ChipValues`; verify no ambiguous `Values` remains (`grep`)

## 4. Editor

- [x] 4.1 Rename `Draft` -> `RecipeDraft`, `IngredientRow` (editor) -> `IngredientLine`, `StepRow` (editor) -> `StepDraft`; verify the DB `IngredientRow` / `StepRow` are untouched and tests pass
- [x] 4.2 Rename `Content` -> `DraftSeed` and `emptyContent` -> `emptyDraftSeed`; verify the stored-draft JSON shape is unchanged (existing `draftStore` tests pass without edits to expectations)

## 5. Wrap-up

- [x] 5.1 Update `STRUCTURE.md` / comments that name old types or `lib/recipes.ts`; verify with `grep` for each old name
- [ ] 5.2 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all clean
