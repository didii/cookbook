# Proposal

## Why

The home page still lists hard-coded sample recipes from `lib/recipes.ts`, while the recipe, new and edit pages already use the database. A recipe added in the app never shows up on the home page, and the sample list shows recipes that don't exist. Kanban card #4 (Browse recipes).

## What Changes

- The home page lists the recipes stored in the database, not the sample data.
- The home page shows a friendly empty state when no recipe is stored yet.
- A recipe card leaves out the preparation time when the recipe has none.
- The sample recipe data (the `recipes` array and the `Recipe` type in `lib/recipes.ts`) is deleted. The `Step` and `Ingredient` types stay, because the app uses them. `seed/dev.sql` is the only sample data left, for local development.

## Capabilities

### New Capabilities
- `recipe-browsing`: the home page lists every stored recipe as a card linking to its page, and says so when there are none.

### Modified Capabilities

None. `recipe-storage` and `recipe-viewing` do not change; removing the sample data is not observable behaviour, so it has no scenario and lives in design and tasks.

## Impact

- `packages/web/app/routes/home/route.tsx` (new loader) and `RecipeCard.tsx` (stored recipe type, optional time).
- `packages/web/app/.server/recipes.ts` (new `listRecipes`).
- `packages/web/app/lib/recipes.ts` (sample data removed).
- No migration, no new dependency.
