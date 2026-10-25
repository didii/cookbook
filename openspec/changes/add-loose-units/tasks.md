# Tasks

## 1. Rules: the looseUnits list

- [x] 1.1 Add `looseUnits` and its defaults to `Rules`/`defaultRules` in `shared/rules.ts`; in `rules.server.ts` let `getRules` fall back to the defaults when the saved value lacks it or holds an invalid one, and verify with `rules.server.test.ts` scenarios "Default loose units" and "Saved rules without loose units"
- [x] 1.2 Add the `looseUnits` form field to `RulesFields`, `toFields` and `readRules` (letters only, may be empty, exempt from the two-lists check) and verify with the scenarios "Add a loose unit", "No loose units", "Loose unit that is also a unit" and "Loose unit with other characters"
- [ ] 1.3 Add the "Losse eenheden" field to `AdminRulesPageRoute.tsx` and verify with its route test that the page shows and saves the list ("Add a loose unit")

## 2. Parsing

- [ ] 2.1 In `parseIngredient` (`lib/shared/ingredients.ts`) give a line that starts with a loose unit and no number value 1 and that unit, and verify with `ingredients.test.ts` scenarios "Loose unit without a number", "Loose unit with a number", "Measure without a number is part of the name", "Loose unit alone has no name", "Loose unit is a whole word" and "Removed loose unit is not recognised"
- [ ] 2.2 Give `parseQuantity` (`lib/quantity.ts`) the rules, return value 1 and the unit for a text that is exactly a loose unit, pass the rules from `cleanStep` in `lib/recipeValidation.ts`, and verify with `quantity.test.ts` and `recipeValidation.test.ts` scenarios "Chip quantity that is a loose unit" and "Chip quantity word that is not a loose unit"
- [ ] 2.3 Check that chips in `chips.test.ts` and `stepParsers.test.ts` still pass, and add a test that "scheutje" written before an ingredient name is the chip's amount with value 1 (design: Risks)

## 3. Finish

- [ ] 3.1 Run `pnpm test:spec add-loose-units` and make sure every delta scenario has a test; then `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai` pass
