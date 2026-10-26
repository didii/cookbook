# Tasks

Verify with the type check and `pnpm test:ai`; `pnpm test:spec remove-filter-threshold` lists the scenarios still without a test.

## 1. Remove the threshold

- [x] 1.1 In `filterRecipes.ts` remove `minRecipesForFilters`; in `HomePageRoute.tsx` drop `detailed` and use the parsed filters as they are
- [x] 1.2 In `FilterBar.tsx` remove the `detailed` prop and always render the sheet and the "Filter" button; update the doc comments

## 2. Tests

- [x] 2.1 Update `FilterBar.test.tsx` (drop `detailed`, remove the "Few recipes" case) and `HomePageRoute.test.tsx` (remove tests of the threshold; add one that the filters show with a single recipe)
- [x] 2.2 Remove the `recipe-filtering › Few recipes` test or `test.todo` if present

## 3. Wrap-up

- [x] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec remove-filter-threshold`; all clean
