## 1. Scaling logic

- [x] 1.1 Export the number pattern and value parser from `lib/ingredients.ts`; add `lib/scale.ts` with `formatNumber`, `scaleQuantity`, `scaleBody` and the multiplier ladder, with `lib/scale.test.ts` covering rounding, comma, ranges, fractions and glyphs, no-number text, factor 1 untouched, units vs durations/temperatures, and the ladder (up, down, between values, floor 1/10)
- [x] 1.2 Name tests in `lib/scale.test.ts` for `recipe-scaling › Ingredient list scales`, `… › Amounts in step text scale`, `… › Times and temperatures do not scale`, `… › Ranges scale`, `… › Quantity without a number`, `… › Original at factor one`, `… › Long numbers are rounded`, `… › Round numbers stay round`

## 2. Recipe page

- [x] 2.1 Add `routes/recipe/ScaleControl.tsx` (− / field / + with 44 px buttons, servings or multiplier mode, draft text committed on blur/Enter, invalid input reverted) with `ScaleControl.test.tsx` for the control scenarios (`Control starts at the stored servings`, `Plus and minus change by one serving`, `Servings do not go below one`, `A typed number is taken over`, `Invalid typing is undone`, `Multiplier starts at one`, `Buttons walk the steps`, `Typed multiplier between steps`, `Typed fraction`)
- [x] 2.2 Hold the chosen amount in `RecipePage`, replace the "n personen" span by the control, pass scaled ingredients, step texts and chip quantities to `IngredientList` and `StepList` (timers and oven untouched); component tests in `RecipePage.test.tsx` for `recipe-scaling › Step chips scale` and `… › Reload resets`
- [ ] 2.3 Check the narrow and wide layouts in the running app (buttons reachable by thumb, control does not break the meta row)

## 3. Finish

- [x] 3.1 `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai`; `pnpm test:spec scale-servings` shows no missing scenarios
