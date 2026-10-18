# Proposal

## Why

Recipes can be stored and viewed, but only seeded by hand. A family member needs to add one from the app. This is board card #6, "Create a recipe", kept to the minimum: the required fields only.

## What Changes

- A "Nieuw recept" link in the existing header leads to a new page `/recepten/nieuw` with a form for the required fields: title and author, plus an optional number of servings.
- Submitting saves the recipe to D1 and redirects to its page (`/recepten/<slug>`). The slug is derived from the title and made unique.
- Required fields are marked with an explained asterisk, errors are tied to their fields and focus moves to the first error, so the form is usable with assistive technology.
- The first migration makes `servings` optional (edited in place, the database is not live yet): a recipe does not need a portion count, and scaling without one is a later concern.
- The author field suggests authors that are already on stored recipes while typing, matches case-insensitively, and still accepts a new name. Typing "oma" when "Oma" exists stores "Oma".
- The saving code accepts every recipe property (time, intro, image, seal, ingredients, steps) so later cards only add form fields; this form just does not offer them yet.
- Invalid input re-shows the form with an error and saves nothing.
- The home page keeps its sample data (card #4 "Browse recipes"), so a new recipe is reachable by the redirect, not yet from the list.

## Capabilities

### New Capabilities
- `recipe-creation`: A family member can add a recipe by providing its required fields, and lands on the saved recipe.

### Modified Capabilities
- `recipe-storage`: servings become optional (still greater than zero when given).
- `recipe-viewing`: the page omits servings when there are none.

## Impact

- `packages/web/app/routes.ts`, new `app/routes/new-recipe/` route (form + action), `app/.server/recipes.ts` (create function), `app/shared/Header.tsx` (link).
- New dependency `@base-ui/react` (headless Autocomplete, styled with our Tailwind tokens). Schema change: `servings` is nullable in `0001_recipes.sql`. `recipe/route.tsx` hides an empty servings count.
