# Tasks

Change 1 of 2; the tag manager follows. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec add-recipe-tags` lists the delta scenarios still without a test.

## 1. Database

- [x] 1.1 Add migration `0013_recipe_tags.sql` renaming `categories` → `tags`, `recipe_categories` → `recipe_tags` and `category_id` → `tag_id`, and dropping `position`; rename the categories tests in `migrations.test.ts` to the "recipe-storage › … tag …" scenarios and add one that rows written before the migration survive it
- [x] 1.2 Update `src/db/seed/dev.sql` to the new names; verify `seed/dev.test.ts` passes

## 2. Server

- [x] 2.0 Add `shared/tags.ts` with `sortTags` (alphabetical, letter case and accents ignored); unit test it in `tags.test.ts`
- [x] 2.1 Rename `RecipeSummary.categories` to `tags`, add `tags: string[]` to `Recipe`, return them from `listRecipes` most used first (ties in the `sortTags` order, compare function exported from `tags.ts`) and from `getRecipe` sorted by `sortTags`, and add `listTags`; test "Recipe with tags", "Recipe without tags", "Listing returns the most used tags first", "Equally used tags are alphabetical", "Reading a recipe returns tags alphabetically" and "Tags are listed alphabetically" in `recipes.server.test.ts`
- [x] 2.2 Store tags in `createRecipe` and `updateRecipe` as designed (omitted keeps, empty list clears, blanks and duplicates dropped, stored spelling reused); test "Unknown tag is created", "Recipe is created with tags", "Recipe tags are replaced", "Update without tags keeps them", "Update with an empty list clears them", "Existing spelling is reused", "Duplicate and blank tags are dropped", "Unused tag remains" and "Recipe with tags deleted"
- [x] 2.3 Add `readTags(form)` to `recipeValidation.ts` (missing or malformed field gives undefined) and use it in the actions of `EditRecipePageRoute` and `NewRecipePageRoute`, and refuse a tag over 100 characters (error on `tags`, shown at the field); test both in `recipeValidation.test.ts`, and the "Tags are stored with the recipe" and "Too long tag is refused on save" and "Many tags are accepted" scenarios through the route action tests

## 3. Card

- [x] 3.1 Rename the card's props and test ids to tags (`RecipeCard-tags`, `RecipeCard-tag`) and the `describe`s in `RecipeCard.test.tsx` and `HomePageRoute.test.tsx` to the renamed "recipe-browsing" scenarios; add `tags: []` to fixtures; verify type check and tests pass

## 4. Editor

- [x] 4.1 Add `tags` to `DraftSeed`/`RecipeDraft`, `emptyDraftSeed`, the dirty check and the draft store (a stored draft without tags reads as `[]`); test "Tags are kept in the draft", "A draft from before tags restores" and "Changing tags counts as an unsaved change" in `draft.test.ts` and `draftStore.test.ts`
- [x] 4.2 Add `TagInput` in `edit-recipe/lib/` (Base UI `Combobox`, multiple, chips with remove buttons, "Toevoegen" item for unknown text, Enter picks the stored spelling, picked tags not suggested); component-test the scenarios "Stored tags are suggested", "Suggestions ignore letter case and accents", "Picked tag is not suggested again", "Picked tags are alphabetical", "A new tag can be added", "Typing an existing tag in other case picks the stored tag", "A picked tag can be removed" and "Tag length is limited", with test ids `TagInput-*`
- [x] 4.3 Put `TagInput` in the side column below the time in `RecipeEditor` with a hidden `tags` input, pass `tags` from both loaders (`listTags`) and the stored tags as the starting value; test "Tags field in the side column", "Stored tags are shown when editing" and "Reset puts the tags back" in `RecipeEditor.test.tsx`; mark the phone-keyboard layout check as `test.todo` with the reason

## 5. Wrap-up

- [ ] 5.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec add-recipe-tags`; all clean
