# Tasks

## 1. Tags on the recipe page

- [ ] 1.1 Move `filterParams` (with its test) from `routes/home/lib/filterRecipes.ts` to `shared/`, since the recipe route may not import from the home route. Verify with `pnpm test:ai`.
- [ ] 1.2 In `RecipeView.tsx`, render `r.tags` as `Pill`s inside `Link`s to `/?${filterParams({ tags: [name] })}`, in a `data-testid="RecipeView-tags"` wrapper with `RecipeView-tag` pills and the wrapper classes of `RecipeCard-tags`, right after the picture frame, only when there are tags. Verify with `pnpm test:spec add-recipe-view-tags`.
- [ ] 1.3 In `RecipeView.test.tsx`, add one `describe` per scenario (`recipe-viewing › Recipe with tags`, `… › Recipe without tags`, `… › Pill opens the filtered home page`). Verify with `pnpm test:ai`.
- [ ] 1.4 Run `pnpm format:fix`, `pnpm lint:fix`, then confirm `pnpm format:check` and `pnpm lint:check` pass.
