# Proposal

## Why

The home page cards will show a recipe's categories (see `redesign-recipe-card`), but the database knows no categories yet. This change adds them to the data layer first, so the card redesign has real data to show.

## What Changes

Change 1 of 2. **`redesign-recipe-card` (change 2) depends on this change**: it must be applied and merged first.

- Add a `categories` table (unique, case-insensitive name) and a `recipe_categories` link table (a recipe has any number of categories, in order).
- `listRecipes` returns each recipe's categories, in order, on `RecipeSummary`.
- Seed categories in `src/db/seed/dev.sql` so the dev database has some.
- Out of scope: editing a recipe's categories in the editor or anywhere else, filtering by category, showing categories in the UI (change 2), and managing the list of categories. Until an editor exists, categories only enter through seeding.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-storage`: a recipe has ordered categories; the recipes list returns them.

## Impact

- DB: one migration adding `categories` and `recipe_categories`; `src/db/seed/dev.sql`; `src/db/migrations/migrations.test.ts`.
- `shared/recipes.server.ts` (`listRecipes`), `shared/recipe.ts` (`RecipeSummary`), and their tests; `src/db/seed/dev.test.ts`.
- No route or component changes. `createRecipe` and `updateRecipe` are untouched: they neither read nor clear categories.
