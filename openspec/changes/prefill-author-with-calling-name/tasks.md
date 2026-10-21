## 1. Prefill

- [ ] 1.1 In `new-recipe/route.tsx` loader, read the user with `getUser` and return `callingName` (`''` when none)
- [ ] 1.2 Pass `initial` and `values` fallback as `{ ...emptyDraftSeed, author: loaderData.callingName }`

## 2. Tests

- [ ] 2.1 Route tests for the three `recipe-creation` scenarios (`recipe-creation › Author is prefilled`, `… › Prefilled author can be changed`, `… › Prefill alone is not a draft`)

## 3. Finish

- [ ] 3.1 `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai`
