# Tasks

## 1. One shared form

- [x] 1.1 Move the form fields, `AuthorInput` and `validate` (with their tests) from `routes/new-recipe/` to `app/shared/` as `RecipeForm`, `AuthorInput` and `recipeValidation`; `RecipeForm` takes the values, errors, authors, heading and button label, and the create route only renders it with empty values; verify that the existing `recipe-creation` tests still pass unchanged and that creating a recipe still works in `pnpm dev`.
- [x] 1.2 Add time, intro (textarea) and image link (text) to `RecipeForm` and pass them from the create action to `createRecipe` (trimmed, empty means none); verify with a test named `recipe-creation › Time, intro and image are stored`, and in `pnpm dev` at 360px and desktop width.
- [x] 1.3 Add `ImagePreview` (takes a `src` and a `tile`; frame, 2:1 image and responsive `TileBand` like the recipe page; shows a text instead of a broken picture on load error) below the image field in `RecipeForm`, with `tile` passed down from the create loader (random) and, later, the edit loader (`tileFor(id)`); verify with `test.todo`s named `recipe-creation › Preview of the image` and `recipe-creation › Image cannot be loaded` (they need a browser, with the reason on the line above) and in `pnpm dev` with a valid, an invalid and an emptied link.
- [x] 1.4 Change `pickSeal` to pick at random among the least used seals (drop the recent-seals rule; update `seals.test.ts`) and make `createRecipe` use it over the stored seals when none is given; verify with tests in `recipes.test.ts` named `recipe-creation › Seal is assigned`, `recipe-creation › Least used seals are chosen` and `recipe-creation › Provided seal is used`.

## 2. Server: update a recipe

- [x] 2.1 Add `updateRecipe(db, slug, fields)` to `app/.server/recipes.ts` (title, author, servings, time, intro, image; sets `updated_at`; keeps slug, ingredients and steps, and the seal unless one is passed in; reuses author spelling from other recipes only; returns whether a recipe matched); verify with tests in `recipes.test.ts` named `recipe-editing › Recipe is updated`, `recipe-editing › Seal kept`, `recipe-editing › Seal provided`, `recipe-editing › Optional field emptied`, `recipe-editing › Edited author reuses spelling` and `recipe-editing › Own author can be respelled`.

## 3. Frontend: edit route and link

- [x] 3.1 Add the `recepten/:slug/bewerken` route (`routes/edit-recipe/`) rendering `RecipeForm` with the stored values, with loader, action, 404 handling and a 400 re-render; verify with route tests named `recipe-editing › Form shows the stored values`, `recipe-editing › Unknown recipe`, `recipe-editing › Invalid edit is refused` and `recipe-editing › Same form for new and existing recipes` (both routes render the same `RecipeForm` component, or a `test.todo` with the reason if it needs a browser).
- [x] 3.2 Add the "Bewerk" link to the recipe page; verify with a test named `recipe-viewing › Link to the edit form` (or a `test.todo` with the reason if it needs rendering) and by editing a recipe end to end in `pnpm dev` at 360px and desktop width.

## 4. Wrap-up

- [x] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; verify all pass.
