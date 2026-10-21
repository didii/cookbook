## 1. Server

- [x] 1.1 Add `deleteRecipe(db, slug)` to `.server/recipes.ts` (`DELETE ... RETURNING image`, `undefined` when no row) with tests in `recipes.test.ts` (cascade removes ingredients, steps, chips, views)
- [x] 1.2 Add `action` to `routes/recipe/route.tsx`: delete, 404 when unknown, `deletePhoto(...).catch(() => undefined)`, `redirect('/')`

## 2. UI

- [x] 2.1 Add `routes/recipe/DeleteRecipe.tsx`: "Verwijder recept" button and modal `<dialog>` naming the recipe with "Verwijderen" (submit) and "Annuleren"; closes on Escape and on a click on the backdrop
- [x] 2.2 Render it in `RecipePage` after the steps, outside the tab panels, and check the narrow and wide layouts

## 3. Tests

- [x] 3.1 Component tests for the `recipe-deletion` button and popup scenarios (`recipe-deletion › Delete button is shown`, `… › Popup asks for confirmation`, `… › Cancel closes the popup`, `… › Click outside closes the popup`, `… › Escape closes the popup`)
- [x] 3.2 Route tests for `recipe-deletion › Recipe is deleted`, `… › Photo is deleted`, `… › Unknown recipe`

## 4. Finish

- [ ] 4.1 `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai`; `pnpm test:spec delete-recipe` shows no missing scenarios
