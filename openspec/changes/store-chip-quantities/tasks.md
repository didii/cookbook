# Tasks

Change 2 of 3. Precondition: `store-ingredient-quantities` is merged. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec store-chip-quantities` lists the delta scenarios still without a test.

## 1. Database

- [x] 1.1 Add migration `0011_chip_quantities.sql` with `quantity_value` and `quantity_unit` on `step_ingredient_chips`; test "Chip with value and unit" and "Non-positive chip value refused" in `migrations.test.ts`
- [x] 1.2 Add value and unit to every chip insert in `src/db/seed/dev.sql`; verify `seed/dev.test.ts` passes

## 2. Server

- [x] 2.1 Add `parseQuantity` in `routes/edit-recipe/lib/quantity.ts` with unit tests (number, fraction, range, unit as the rest, no number)
- [x] 2.2 Have `cleanStep` set `quantityValue` / `quantityUnit` on chips; test scenarios "Chip quantity is read from its text on save" and "Chip range has no quantity value" in `recipeValidation.test.ts`
- [x] 2.3 Insert and select the two columns for chips in `recipes.server.ts`; change `Step.ingredients` in `shared/recipe.ts`; update `recipes.server.test.ts` ("Chip without a quantity", "Chips keep their order" still pass)

## 3. Scaling

- [x] 3.1 Map the chips of `RecipeView.tsx` through `scaleIngredient`; update the fixtures and tests for "Step chips scale", "Chip range stays as written", "Chip keeps its own unit"

## 4. Wrap-up

- [ ] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all clean
