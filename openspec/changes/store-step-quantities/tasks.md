# Tasks

Change 3 of 3. Precondition: `store-ingredient-quantities` and `store-chip-quantities` are merged. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec store-step-quantities` lists the delta scenarios still without a test.

## 1. Database

- [x] 1.1 Add migration `0012_step_quantities.sql` for `step_quantities`; test the scenarios of "A step stores the amounts in its text" in `migrations.test.ts`
- [ ] 1.2 Generate `step_quantities` rows for the seeded steps in `src/db/seed/dev.sql` with `findQuantities` (once task 2.2 exists); add the span-text check to `seed/dev.test.ts`

## 2. Move the parsers into the editor

- [x] 2.1 Move `parseIngredient`, `joinIngredient`, `ParsedIngredient` to `routes/edit-recipe/lib/shared/ingredients.ts` and `shared/stepParsers.ts` to `routes/edit-recipe/lib/shared/stepParsers.ts`, with their tests; update imports in the editor (relative within the module); rename the rest of `shared/ingredients.ts` to `shared/numbers.ts` (`numberPattern`, `numberValue`) and update `scale.ts` and `parseQuantity`
- [ ] 2.2 Add `routes/edit-recipe/lib/quantities.ts` with `findQuantities(body, rows, rules)` and unit tests (rules unit, before ingredient name, overlap, duration/temperature/range not found)

## 3. Server

- [ ] 3.1 Pass ingredient rows and rules to `readSteps`, compute the quantities of each cleaned body, in the edit and the create action; test "Amount before a unit and before an ingredient", "Places refer to the stored text", "Durations, temperatures and ranges are not stored"
- [ ] 3.2 Insert, replace and select `step_quantities` in `recipes.server.ts`, add `Step.quantities` in `shared/recipe.ts`; test "Saving again replaces the amounts" and the read order

## 4. Scaling

- [ ] 4.1 Add `scaleText` to `scale/scale.ts` with unit tests; use it in `RecipeView.tsx` for step bodies
- [ ] 4.2 Remove `scaleQuantity`, `scaleBody` and the text regexes and their tests; update `RecipeView.test.tsx` and `scale.test.ts` for the scenarios "Amounts in step text scale", "Range in step text stays as written", "Text without stored amounts stays as written"
- [ ] 4.3 Check with grep that no file outside `routes/edit-recipe` imports `parseIngredient`, `joinIngredient` or `stepParsers`

## 5. Wrap-up

- [ ] 5.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all clean
