# Tasks

## 1. Range grammar

- [x] 1.1 Add `rangePattern` (and a `rangeValues` helper returning both numbers) to `src/app/shared/numbers.ts`, covering `-`, `–`, `—`, `à`, `tot en met`, `tot`, `of`, `to`, `or` and the `tussen … en …` prefix form, with fractions and glyphs on each side. Verify with new cases in `src/app/shared/numbers.test.ts` (every separator, fractions, comma/slash/tilde refused, `2 en 3` alone refused).

## 2. Database and types

- [x] 2.1 Add `src/db/migrations/0015_quantity_ranges.sql`: `quantity_value_max` on `ingredients` and `step_ingredient_chips`; rebuild `step_quantities` with `quantity_value_max`, `max_start_index`, `max_end_index` and the all-or-none and ordering checks. Verify with scenarios in `src/db/migrations/migrations.test.ts` (`recipe-storage › Non-positive maximum refused`, `Maximum without a value refused`, `Non-positive chip maximum refused`, `Range needs all three fields`, `Second number must come after the first`, `Range amount with both places`, `Non-positive maximum in text refused`).
- [x] 2.2 Add `quantityValueMax` to `RecipeIngredient`, `StepIngredient` and `StepQuantity` (with the second number's place) in `src/app/shared/recipe.ts`, and read and write it in `src/app/shared/recipes.server.ts`. Verify with `src/app/shared/recipes.server.test.ts` (`recipe-storage › Range is read with the recipe`, `Range amount with both places`).

## 3. Parsing on save

- [x] 3.1 Make `parseIngredient` (`lib/shared/ingredients.ts`) and `parseQuantity` (`lib/quantity.ts`) return value and maximum for a range via `rangePattern`. Verify with `ingredients.test.ts` and `quantity.test.ts` (`recipe-storage › A quantity can be a range`, `A range stores both numbers`, `Chip range is read from its text on save`).
- [x] 3.2 Make `findQuantities` (`lib/quantities.ts`) return a range as one amount with both spans, only when the unit or ingredient name follows the second number; drop the "ranges are excluded" filter; `2 el - 3 el` yields two single amounts; duration ranges stay out. Verify with `quantities.test.ts` (`Unit on both sides is no range`, `Range before a unit and before an ingredient`, `Duration range is not stored`), replacing the old "finds no range" tests.
- [x] 3.3 Pass the maximum and second place through `recipeValidation.ts` and the save path. Verify with `recipeValidation.test.ts` and a save-then-read test of `Range is read with the recipe` in `src/app/routes/edit-recipe`.

## 4. Scaling

- [ ] 4.1 Update `scaleIngredient` (`routes/recipe/lib/scale/scale.ts`) to show a range as `<min>-<max> <unit>` scaled with `formatNumber`, factor 1 unchanged. Verify with `scale.test.ts` (`recipe-scaling › Ingredient range scales`, `Ingredient range is shown with a dash`, `Chip range scales`, `Reversed range scales both numbers`, `Range numbers are short`, `Range at factor one`).
- [ ] 4.2 Update `scaleText` to replace both number spans of a range amount in place, leaving the separator and words; skip the whole amount when either span is no longer a number or overlaps. Verify with `scale.test.ts` (`Range in step text keeps its words`) and a case for an edited half-range.
- [ ] 4.3 Check the recipe page end to end: `RecipeView.test.tsx` shows a doubled range in the ingredient list, a chip and step text (`Ingredient range scales`, `Range in step text keeps its words`).

## 5. Wrap up

- [ ] 5.1 Add a range or two to `src/db/seed/dev.sql` (`src/db/seed/dev.test.ts` still passes) and mention the new syntaxes where the editor documents the quantity format, if it does.
- [ ] 5.2 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec scale-ranges`; all clean, and every delta scenario has a `describe` named `<capability> › <Scenario title>`.
