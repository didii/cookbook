## 1. Data

- [x] 1.1 Add `RecipeSummary` and `listRecipes(db)` (newest first) to `.server/recipes.ts`, with tests in `recipes.test.ts`

## 2. Home page

- [ ] 2.1 Add a loader to `home/route.tsx` that returns `listRecipes`, render from `loaderData`, with the count line and the empty state linking to `/recepten/nieuw`
- [ ] 2.2 Make `RecipeCard` take `RecipeSummary` and leave out the time when there is none
- [ ] 2.3 Loader tests for every `recipe-browsing` scenario (`home/route.test.ts`, in-memory D1 like `recipe/route.test.ts`)

## 3. Remove sample data

- [ ] 3.1 Delete the `recipes` array, the `Recipe` type and the helpers from `lib/recipes.ts`, keep `Ingredient` and `Step`; fix the file comment
- [ ] 3.2 Update `STRUCTURE.md` ("helpers, sample data") and grep for leftover references to the sample data
- [ ] 3.3 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm test:ai`, `pnpm test:spec home-recipes-from-db`; confirm `format:check` and `lint:check`
