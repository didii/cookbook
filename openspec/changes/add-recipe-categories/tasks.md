# Tasks

Change 1 of 2. `redesign-recipe-card` depends on this one. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec add-recipe-categories` lists the delta scenarios still without a test.

## 1. Database

- [ ] 1.1 Add the migration `<next free number>_recipe_categories.sql` with `categories` and `recipe_categories` as in design.md; test "Recipe with categories", "Category name is unique", "Category is shared", "Category linked twice is refused", "Link needs a recipe and a category" and "Recipe deleted" in `migrations.test.ts`
- [ ] 1.2 Seed categories in `src/db/seed/dev.sql` (clear `categories` first, link them to the seeded recipes, leave one recipe without); verify `seed/dev.test.ts` passes and extend it to check that some recipe has categories

## 2. Server

- [ ] 2.1 Add `categories: string[]` to `RecipeSummary` in `shared/recipe.ts` and return them, in order, from `listRecipes`; test "Recipe without categories" and "Listing returns categories in order" in `recipes.server.test.ts`, and add `categories: []` to existing fixtures so the type check passes

## 3. Wrap-up

- [ ] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all clean
