# Proposal

## Why

Amounts inside a step's text ("Meng 200 g bloem met 2 eieren") are found again by regex on every servings change, with the same parsers the editor used when the step was saved. The editor action can find them once, on save, and store where they are. The recipe page then only multiplies, and the text parsers no longer need to ship in the recipe route.

## What Changes

Change 3 of 3. **Depends on `store-ingredient-quantities` (change 1) and `store-chip-quantities` (change 2)**, both merged first: they introduce the `quantity_value` / `quantity_unit` naming, `RecipeIngredient`, `scaleIngredient` and `parseQuantity`, and they stop `scaleQuantity` from being used for the list and chips, which this change removes.

- New table `step_quantities`: one row per scalable amount in a step's text, with where it is (`start_index`, `end_index`: UTF-16 offsets of the number in the stored body, end exclusive), `quantity_value` and `quantity_unit`. No position column; rows are ordered by `start_index`.
- The server finds the amounts when a recipe is saved, from the cleaned step text, the recipe's ingredient lines and the recognition rules, with the parser the editor already uses. The client posts no spans. Covered: a number followed by a unit of the rules, and a number written right before the name of one of the recipe's ingredients. Not covered: times and temperatures. Ranges are out of scope: the syntax for what a range means is not defined (board card #44).
- The recipe page reads the amounts with each step and scales a step's text by replacing each stored span with `quantity_value × factor`. At the recipe's own servings the text is shown as stored.
- Cleanup: `scaleQuantity`, `scaleBody` and the text scanning in `scale/scale.ts` go. `parseIngredient`, `joinIngredient`, `stepParsers` and their tests move into `routes/edit-recipe/lib`, so no code outside the editor parses ingredient or step text. `numberPattern` and `numberValue` stay shared in `shared/numbers.ts`, because the recipe page parses a typed multiplier ("1/3") with them.
- Update the seed data with the amounts of every seeded step.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-storage`: new requirement for the amounts stored with a step's text, found on save.
- `parsing-rules`: "Recognition follows the stored rules" is replaced by "Recognition follows the stored rules on save": the rules are applied when a step is saved, not when the page scales, and "Scaling uses the stored units" becomes "Saving uses the stored units".
- `recipe-scaling`: the ingredient and chip requirements are replaced by "Every quantity scales from its stored value", which also covers step text from stored spans.

## Impact

- DB: migration `0012_step_quantities.sql`; `src/db/seed/dev.sql`; `migrations.test.ts`, `seed/dev.test.ts`.
- `shared/recipes.server.ts` (insert and select of spans per step), `shared/recipe.ts` (`Step.quantities`).
- `routes/edit-recipe`: new `lib/quantities.ts` (finds the spans), `recipeValidation.ts` / action pass ingredient rows and rules to `readSteps`; moved files `lib/shared/ingredients.ts`, `lib/shared/stepParsers.ts` (+ tests) from `shared/`.
- `routes/recipe/lib/scale/scale.ts`, `RecipeView.tsx` and tests; `shared/ingredients.ts` becomes `shared/numbers.ts`.
