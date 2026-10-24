# Design

## Context

Change 1 of 3; it has no dependency on the other two, they depend on it (see proposal.md). Today the editor action runs `parseIngredient` and `updateRecipe` / `createRecipe` already insert `amount` and `unit`, but `getRecipe` selects only `quantity_text` and `name`, so the recipe page re-parses the text with the regex in `scale/scale.ts` on every servings change. The shared `Ingredient` type (`quantityText`, `name`) is used for both ingredient rows and step chips; chips have no stored values yet (change 2).

## Goals / Non-Goals

**Goals:**
- Name the three quantity columns as a group and read them back.
- The ingredient list multiplies the stored value instead of parsing text.

**Non-Goals:**
- Chips and step text (changes 2 and 3); `scaleQuantity` and `scaleBody` stay as they are in this change.
- Ranges: the syntax for what a range means is not defined (board card #44). Changing a unit to fit a scaled value.
- The unused `step_ingredients` table.

## Decisions

- **Rename with a migration, not by editing `0001`.** `0010_ingredient_quantity_columns.sql`: `ALTER TABLE ingredients RENAME COLUMN amount TO quantity_value` and the same for `unit`. SQLite keeps the `CHECK (amount > 0)` working under the new name. Alternative: edit `0001`; rejected, applied migrations must not change.
- **Property names `quantityValue` / `quantityUnit`**, aliased in SQL like `quantityText`, so the TS shapes mirror the columns. `ParsedIngredient` in `shared/ingredients.ts` renames `amount` → `quantityValue` and `unit` → `quantityUnit`; this removes the old TODO about the future names.
- **Separate recipe ingredient type.** `recipe.ts` gets `RecipeIngredient = Ingredient & { quantityValue: number | null; quantityUnit: string | null }` for `Recipe.ingredients`; `Step.ingredients` (chips) keeps `Ingredient` until change 2. Alternative: add optional fields to `Ingredient`; rejected, it would let a chip look like it has values when it has none.
- **Scaled text built from the value.** A new `scaleIngredient(ingredient, factor)` in `scale/scale.ts`: factor 1 or no `quantityValue` → `quantityText`; otherwise `formatNumber(value × factor)` followed by the unit when there is one. `formatNumber` (3 significant digits, comma) is reused, so "Scaled numbers are short" keeps holding. `RecipeView` calls it for the list; chips and step text still use `scaleQuantity` / `scaleBody`.
- **Ranges.** Out of scope: the syntax for what a range means is not defined (board card #44).
- **Seed.** `dev.sql` ingredient inserts get `quantity_value` and `quantity_unit` for every quantity with a number ("½ tl" → 0.5, "tl"; "1" → 1, no unit).

## Risks / Trade-offs

- A displayed unit is the stored lowercase unit, not the spelling typed ("Tl." scales to "tl"). → Accepted; it only differs once the servings change.
- Quantity text and value could drift if someone edits the DB by hand. → The editor action is the only writer and derives both from the same line.

## Migration Plan

Run the migration. No data to convert (no live data). Rollback: rename the columns back.
