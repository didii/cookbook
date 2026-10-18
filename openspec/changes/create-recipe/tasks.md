# Tasks

## 1. Server: create a recipe

- [x] 1.1 Add the slug helper (diacritics, punctuation, empty fallback, reserved `nieuw`, uniqueness suffix) and `createRecipe` accepting all properties in `app/.server/recipes.ts`; verify with tests in `recipes.test.ts` named `recipe-creation › Slug from title`, `recipe-creation › Same title twice`, `recipe-creation › Title that clashes with the form address`, and a unit test that a recipe with all properties, ingredients and steps reads back via `getRecipe`.

## 2. Frontend: form and link

- [x] 2.1 Add the `recepten/nieuw` route (declared before `recepten/:slug`) with the form (title, author, servings), an action that validates, creates with the user's email and redirects, and a 400 re-render with errors and entered values; verify with action-level tests named `recipe-creation › Recipe is created`, `recipe-creation › Missing title` and `recipe-creation › Invalid servings`.
- [x] 2.2 Add the link to `Header.tsx` ("+ Nieuw" on phones where the email is hidden, "Nieuw recept" plus email from `sm`); verify with a test named `recipe-creation › Link to the form` and `recipe-creation › Link on a narrow screen` (or a `test.todo` with the reason if rendering the header is not testable without a browser) and by running `pnpm dev`, checking the header at 360px and desktop width, and creating a recipe end to end.

## 3. Author autocomplete

- [x] 3.1 Add `listAuthors` and the case-insensitive author reuse in `createRecipe` (`app/.server/recipes.ts`); verify with tests named `recipe-creation › Existing authors are suggested`, `recipe-creation › New author is accepted` and `recipe-creation › Existing spelling is reused`.
- [x] 3.2 Add `@base-ui/react` and the `AuthorInput` component with the route loader supplying the authors; verify with a loader-level test named `recipe-creation › Suggestions ignore letter case` (the filter configuration, or a `test.todo` with the reason if it needs a browser), and by typing "oma" in `pnpm dev` at 360px and desktop width and submitting a new author.

## 4. Optional servings and accessibility

- [x] 4.1 Make `servings` nullable in `0001_recipes.sql`, make servings optional in `.server/recipes.ts`, the action and the recipe page; verify with tests named `recipe-storage › Servings are optional`, `recipe-creation › Servings left empty` and an updated `recipe-viewing › Optional fields are empty`.
- [x] 4.2 Mark required fields with the explained asterisk, drop `required` from servings, and focus the first field in error; verify by `test.todo`s named `recipe-creation › Required fields are marked` and `recipe-creation › Errors are announced and focused` (they need a browser, with the reason on the line above) and by tabbing through the form and submitting it empty in `pnpm dev`.

## 5. Wrap-up

- [x] 5.1 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; verify all pass.
