# Design

## Context

Change 2 of 3. Depends on `store-ingredient-quantities` (change 1), which must be merged: it introduces the columns `quantity_value` / `quantity_unit`, the `RecipeIngredient` type and `scaleIngredient` in `scale/scale.ts`, all reused here. Change 3 depends on this one. Chips are posted by the editor as `{ quantityText, name }`; `cleanStep` in `recipeValidation.ts` cleans them on the server. A chip's `quantityText` is only the quantity ("200 g", "1 klontje", empty), the name is separate, and a chip may show the row's own quantity as a fallback when the step text writes none.

## Goals / Non-Goals

**Goals:**
- Chips store a value and unit derived once on save and scale from them.

**Non-Goals:**
- Step text amounts (change 3); a single shared table for chips and text amounts (they can differ, see proposal).
- Ranges: the syntax for what a range means is not defined (board card #44). Changing units.

## Decisions

- **Same column names as change 1.** Migration `0011_chip_quantities.sql`: `ALTER TABLE step_ingredient_chips ADD COLUMN quantity_value REAL CHECK (quantity_value > 0)` and `ADD COLUMN quantity_unit TEXT`. Both nullable; existing rows stay valid.
- **The server derives the values.** `cleanStep` sets `quantityValue` / `quantityUnit` from the cleaned `quantityText`; the posted JSON stays `{ quantityText, name }`. The server never trusts a client-computed value, same as ingredient lines (`readIngredients`).
- **A chip is only a quantity, so the rest after the number is the unit.** `parseIngredient` only accepts words from `rules.units` because a typed line also holds a name. A chip's text has no name, so a new `parseQuantity(text)` (in `edit-recipe/lib/quantity.ts`, reusing `numberPattern` / `numberValue` from `shared/ingredients.ts`) takes the number and returns everything after it as the unit: "1 klontje" → value 1, unit "klontje"; "½ tl" → 0,5, "tl". Text without a leading number gives no value. Alternative: reuse `parseIngredient` on the chip text; rejected, "1 klontje" would lose "klontje" when scaled because it is not a rules unit.
- **Chip type.** `Step.ingredients` becomes `RecipeIngredient[]` (value and unit nullable). Code that builds steps for the editor draft keeps working with the optional fields; the chip logic in the editor continues to work on `quantityText`.
- **Scaling.** `RecipeView` maps chips through `scaleIngredient` (from change 1); `scaleQuantity` is then only used for step text and goes in change 3.
- **Seed.** Every seeded chip gets value and unit ("250 g" → 250, "g"; "1" → 1, null; "1 klontje" → 1, "klontje").

## Risks / Trade-offs

- A unit that is not a known unit is stored (anything after the number). → Only a display detail; the editor already lets the user type any chip text.
- Chip value and text drift if edited by hand in the DB. → Only the editor action writes them.

## Migration Plan

Run the migration; existing chips get NULL and are shown as written when scaled. No live data. Rollback: drop the two columns.
