# Tasks

Apply after `tag-manager` is merged. Verify with the type check and `pnpm test:ai`; `pnpm test:spec tag-category-in-editor-suggestions` lists the scenarios still without a test.

## 1. Data to the editor

- [x] 1.1 In `EditRecipePageRoute.tsx` and `NewRecipePageRoute.tsx` loaders, read `listManagedTags(db)` and pass `tagCategories` (name → category, tags with a category only); update the loader tests

## 2. The field

- [x] 2.1 Add a `tagCategories` prop to `TagInput` and `RecipeEditor` (pass-through); in `TagInput` render each stored option as name (`TagInput-name`) and, when it has a category, a `Pill` `category` variant (`TagInput-category`); no pill on the "Toevoegen" offer or on picked chips
- [x] 2.2 Update `TagInput.test.tsx` (options read through `TagInput-name`) and add tests for "recipe-form › Suggestion with a category", "Suggestion without a category", "Offer for a new tag has no pill", "Picked tag has no category pill"; update `RecipeEditor.test.tsx` so the parent only checks that the data is passed on

## 3. Wrap-up

- [x] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec tag-category-in-editor-suggestions`; all clean
