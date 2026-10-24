# Tasks

Change 1 of 3. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec store-ingredient-quantities` lists the delta scenarios still without a test.

## 1. Database

- [x] 1.1 Add migration `0010_ingredient_quantity_columns.sql` renaming `ingredients.amount` → `quantity_value` and `unit` → `quantity_unit`; update `migrations.test.ts` (scenarios "Quantity with amount and unit", "Quantity without a number", "Non-positive amount refused")
- [x] 1.2 Add `quantity_value` / `quantity_unit` to the ingredient inserts of `src/db/seed/dev.sql`; verify `seed/dev.test.ts` passes

## 2. Server and types

- [ ] 2.1 Rename `amount` / `unit` to `quantityValue` / `quantityUnit` in `ParsedIngredient` (`shared/ingredients.ts`), `recipeValidation.ts` and the insert/update statements of `recipes.server.ts`; drop the TODO on the old parsing
- [ ] 2.2 Select `quantity_value` and `quantity_unit` in `getRecipe`, add `RecipeIngredient` to `shared/recipe.ts` and use it for `Recipe.ingredients`; test scenarios "Quantity value and unit are read with the recipe" and "Range has no quantity value" in `recipes.server.test.ts` / the edit route test

## 3. Scaling

- [ ] 3.1 Add `scaleIngredient` to `routes/recipe/lib/scale/scale.ts` with unit tests (value × factor, factor 1, no value, unit kept)
- [ ] 3.2 Use it in `RecipeView.tsx` for the ingredient list; update `RecipeView.test.tsx` / `IngredientList.test.tsx` fixtures and the scenarios "Ingredient list scales", "Ingredient range stays as written", "Scaled ingredient keeps its unit"; change the scenario "Ranges scale" test to use step text

## 4. Wrap-up

- [ ] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all clean
