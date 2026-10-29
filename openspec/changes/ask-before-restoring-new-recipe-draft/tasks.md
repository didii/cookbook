## 1. Popup

- [ ] 1.1 `lib/RestoreDraftDialog.tsx` (+ test): modal `<dialog>` with testids for photo, title, servings, source, ingredients, steps, the "+ N meer" lines, and the two buttons ("Gebruik concept", "Weggooien"); first 3 ingredients and 2 steps, blank ones skipped, empty fields left out; Escape does not close it. Tests for "The popup shows the basics", "A draft without a photo or source", "The popup cannot be dismissed without a choice"
- [ ] 1.2 Check by hand at 390px and 1280px that the popup fits and scrolls with a long draft

## 2. Editor

- [ ] 2.1 In `RecipeEditor.tsx`, for a new recipe hold the restoring start as `pending` and keep `ready` false; render `RestoreDraftDialog`; Use applies the start (state, base, restored line, step reset) and sets `ready`; Discard clears the draft and sets `ready`. A stored recipe keeps restoring at once
- [ ] 2.2 Editor tests (`RecipeEditor.test.tsx`, `NewRecipeForm.test.tsx`): "An unfinished new recipe returns", "Using the draft", "Discarding the draft" (also on the import page: import box shown), "Nothing is written before the choice", "A stored recipe asks nothing". Update existing tests that expect a new recipe draft to restore at once
- [ ] 2.3 If `import-recipe-from-url` is merged, make its "Imported content is kept as a draft" test choose "use" first

## 3. Finish

- [ ] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec ask-before-restoring-new-recipe-draft`; all clean
