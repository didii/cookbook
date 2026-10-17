# Tasks

## 1. Server: create a recipe

- [x] 1.1 Add the slug helper (diacritics, punctuation, empty fallback, reserved `nieuw`, uniqueness suffix) and `createRecipe` accepting all properties in `app/.server/recipes.ts`; verify with tests in `recipes.test.ts` named `recipe-creation › Slug from title`, `recipe-creation › Same title twice`, `recipe-creation › Title that clashes with the form address`, and a unit test that a recipe with all properties, ingredients and steps reads back via `getRecipe`.

## 2. Frontend: form and link

- [x] 2.1 Add the `recepten/nieuw` route (declared before `recepten/:slug`) with the form (title, author, servings), an action that validates, creates with the user's email and redirects, and a 400 re-render with errors and entered values; verify with action-level tests named `recipe-creation › Recipe is created`, `recipe-creation › Missing title` and `recipe-creation › Invalid servings`.
- [x] 2.2 Add the link to `Header.tsx` ("+ Nieuw" on phones where the email is hidden, "Nieuw recept" plus email from `sm`); verify with a test named `recipe-creation › Link to the form` and `recipe-creation › Link on a narrow screen` (or a `test.todo` with the reason if rendering the header is not testable without a browser) and by running `pnpm dev`, checking the header at 360px and desktop width, and creating a recipe end to end.

## 3. Wrap-up

- [x] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; verify all pass.
