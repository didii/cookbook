# Tasks

Precondition: `rename-recipe-types` is merged. Verify each task with the type check and `pnpm test:ai`.

## 1. Check stored drafts

- [ ] 1.1 Confirm `RecipeDraft` and `StoredDraft` never contain `quantity_text` (grep `lib/draft*.ts` and `lib/chips.ts` state types); if they do, bump `version` in `lib/draftStore.ts` and add a test that an old draft is ignored

## 2. Rename the property

- [ ] 2.1 Rename `quantity_text` to `quantityText` in `lib/recipe.ts` and `.server/recipes.ts` (alias the SQL selects, keep column names in inserts); verify `.server/recipes.test.ts` and route tests pass
- [ ] 2.2 Rename in `lib/chips.ts`, `shared/recipeValidation.ts` (`cleanStep`) and the recipe views; verify `chips`, `recipeValidation`, `StepList` and `RecipePage` tests pass
- [ ] 2.3 Update remaining tests and fixtures; verify `grep -r quantity_text packages/web/app` finds only SQL column names in `.server/recipes.ts`

## 3. Wrap-up

- [ ] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all clean
