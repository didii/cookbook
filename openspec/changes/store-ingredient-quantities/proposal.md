# Proposal

## Why

An ingredient is saved with `quantity_text` (as typed) and, since the first data model, columns `amount` and `unit` that the editor already fills on save. But nothing reads them back: the recipe page gets only the text and parses it again with a regex every time the servings change. The separate values are stored, unused, and under a name (`amount`, `unit`) that does not show they belong to `quantity_text`.

## What Changes

This is change 1 of 3 (`store-ingredient-quantities` → `store-chip-quantities` → `store-step-quantities`). The goal of the three: quantities are parsed once, on save, and the recipe page only multiplies stored numbers. This change covers the ingredient list. It stands alone; the other two build on it.

- **BREAKING** (database): rename `ingredients.amount` → `quantity_value` and `ingredients.unit` → `quantity_unit`, so the three columns read as one group. A new migration; no live data to keep.
- Read `quantity_value` and `quantity_unit` of each ingredient in `getRecipe`, and carry them in the ingredient type of the recipe page.
- The ingredient list scales by `quantity_value × factor`. At the recipe's own servings (factor 1) the list shows `quantity_text` as written. Only the value scales; the unit is shown as stored (no automatic switch to a better fitting unit).
- An ingredient with no `quantity_value` (no number, or a range like "2-3 el") is shown as written at every factor. **BREAKING** (behaviour): ranges in the ingredient list no longer scale (see board card #44).
- Update the seed data so every seeded ingredient with a number has `quantity_value` and `quantity_unit`.
- Out of scope: step chips (`store-chip-quantities`), amounts in step text (`store-step-quantities`), converting the unit, the legacy `step_ingredients` table (not used by the app; left as is).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-storage`: "Ingredient quantities can be scaled" uses `quantity_value` and `quantity_unit`, and the stored values are returned when a recipe is read.
- `recipe-scaling`: "All quantities scale" scales the ingredient list from the stored value and unit; ranges are no longer scaled; a quantity without a stored value is shown as written.

## Impact

- DB: new migration `0010_…` renaming two columns; `src/db/seed/dev.sql`; `src/db/migrations/migrations.test.ts`.
- `src/app/shared/recipes.server.ts` (select, insert, update), `src/app/shared/recipe.ts` (type), `src/app/shared/ingredients.ts` (`ParsedIngredient` fields).
- `src/app/routes/edit-recipe/lib/recipeValidation.ts` passes the renamed fields.
- `src/app/routes/recipe/lib/RecipeView.tsx`, `IngredientList.tsx`, `scale/scale.ts` (a function that scales a stored value), and their tests.
- Dependencies: none on other open changes. Changes 2 and 3 depend on this one.
