# Proposal

## Why

Step ingredient chips store only `quantity_text` and `name`. The recipe page therefore parses a chip's text with a regex on every servings change, while the editor already knows the quantity when the recipe is saved. After `store-ingredient-quantities` the ingredient list scales from stored numbers; chips should too.

## What Changes

Change 2 of 3. **Depends on `store-ingredient-quantities`** (change 1: the column naming `quantity_value` / `quantity_unit`, `RecipeIngredient`, `scaleIngredient`); it must be applied and merged first. `store-step-quantities` (change 3) depends on this one.

- Add `quantity_value` and `quantity_unit` to `step_ingredient_chips`, next to `quantity_text`.
- The server derives both from the chip's quantity text when a recipe is saved (the client does not post them), and returns them when the recipe is read.
- A chip scales by `quantity_value × factor` with its stored unit; at the recipe's own servings it shows `quantity_text` as written. A chip without a stored value (no number, or a range) is shown as written at every factor. **BREAKING** (behaviour): ranges in chips no longer scale (see board card #44).
- A chip keeps its own quantity: it can differ from the ingredient row and from the number in the step's text, so chips and step-text amounts remain separate (text amounts follow in change 3).
- Update the seed data so every seeded chip with a number has `quantity_value` and `quantity_unit`.
- Out of scope: amounts inside step text and the parser cleanup (change 3), converting units, scaling ranges.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-storage`: "A step has ingredient chips of its own" also stores and returns an optional quantity value and quantity unit per chip.
- `recipe-scaling`: "All quantities scale" scales chips from the stored value and unit; a chip range is shown as written.

## Impact

- DB: migration `0011_…` adding two columns; `src/db/seed/dev.sql`; `migrations.test.ts`.
- `shared/recipes.server.ts` (select and insert of chips), `shared/recipe.ts` (step chip type).
- `routes/edit-recipe/lib/recipeValidation.ts` (`cleanStep` derives the values), a new quantity parser beside it.
- `routes/recipe/lib/RecipeView.tsx` and its tests (chips use `scaleIngredient`).
