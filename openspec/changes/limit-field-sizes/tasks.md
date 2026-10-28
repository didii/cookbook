# Tasks

Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec limit-field-sizes` lists the delta scenarios still without a test.

## 1. Limits in validation

- [ ] 1.1 In `recipeValidation.ts` export the limits (title 200, author 100, time 100, intro 5000, ingredient line 200, step 2000, timer name 100, chip quantity 50, chip name 200, 100 ingredients, 100 steps, 100 chips per step, 50 tags, servings 999) and extend `validate` for title, author, time, intro and servings with messages that state the limit; test "Title at the limit is accepted", "Title over the limit is refused", "Each other text field is refused over its limit", "Whitespace does not count", "999 servings are accepted", "1000 servings are refused", "Zero and non-numbers keep being refused" in `recipeValidation.test.ts` (expected numbers come from the exported constants)
- [ ] 1.2 In `readIngredients` refuse a line over 200 characters on its row and the 101st non-blank line on its row; test "An ingredient line over the limit is refused on its row", "100 ingredients are accepted", "101 ingredients are refused", "Blank lines do not count"
- [ ] 1.3 Add `steps` to `RecipeFormErrors`; in `readSteps` refuse a step text over 2000, a timer name over 100, a chip quantity over 50, a chip name over 200, more than 100 chips in a step and the 101st non-blank step, each on its row; test "A step over the limit is refused on its row", "A step's timer name and chips are limited", "101 steps are refused", "101 chips in one step are refused"
- [ ] 1.4 Extend the tag check to at most 50 tags; test "50 tags are accepted" and "51 tags are refused", and keep "Many tags are accepted"

## 2. Routes

- [ ] 2.1 In `NewRecipePageRoute.tsx` and `EditRecipePageRoute.tsx` put the new errors in `errors` and return 400 with the entered values, storing nothing; route test "Editing is limited the same way"

## 3. Editor

- [ ] 3.1 Put `maxLength` from the exported limits on the title, author, time and intro inputs and on the ingredient and step inputs (pasted text is cut at the limit); component test "Typing stops at the limit" through test ids
- [ ] 3.2 Show `errors.steps` on the step rows (`StepList.tsx`) the way `errors.ingredients` shows on ingredient rows, and let the "first field in error" focus include a step; component tests in the `StepList` and `RecipeEditor` tests

## 4. Database

- [ ] 4.1 Add `0016_size_limits.sql`: copy `ingredients`, `steps`, `step_ingredients`, `step_ingredient_chips`, `step_quantities`, `recipe_views`, `recipe_likes`, `recipe_notes` and `recipe_tags` into temporary tables; drop and recreate `recipes`, `ingredients`, `steps` and `step_ingredient_chips` with `CHECK (length(col) <= N)` (servings `BETWEEN 1 AND 999`) and their indexes; copy all rows back with the same ids, parents first; drop the temporary tables. Comment each limit. If `PRAGMA legacy_alter_table = ON` works in Miniflare and D1, renaming the old table first is allowed as a shorter variant (see design)
- [ ] 4.2 In `migrations.test.ts` fill every affected table, apply `0016`, and test that all rows, ids and links survive; test "Recipe columns are limited", "Recipe update is limited", "Other recipe text columns are limited", "Ingredient columns are limited", "Step and chip columns are limited"; check `src/db/seed` still loads
- [ ] 4.3 Before running the migration in production, take a D1 export or note the time-travel bookmark

## 5. Wrap-up

- [ ] 5.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec limit-field-sizes`; all clean
