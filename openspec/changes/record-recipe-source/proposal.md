## Why

A recipe only records its author, the family member it is "van". Many recipes come from elsewhere: a website, a cookbook, a neighbour. That origin is lost, and nobody can go back to the original page. Backlog card #23.

## What Changes

- A recipe gets an optional **source**: free text for who or what it came from ("Libelle", "Buurvrouw Marie"), or a link.
- The editor gets a "Bron" field in the side column, below the author. It is kept in the unsaved-changes draft like the other fields.
- The recipe page shows the source next to the author, time and servings. A source that is a web address (`http://` or `https://`) is shown as a link that opens in a new tab; any other text is shown as is.
- The source is at most 500 characters, enforced by the editor, the server and the database.

## Capabilities

### New Capabilities

- `recipe-source`: storing, entering and showing where a recipe came from.

### Modified Capabilities

None. The existing specs list their fields in prose without a requirement that the source contradicts; the new capability owns every source scenario.

## Impact

- New migration `src/db/migrations/0016_recipe_source.sql`: `ALTER TABLE recipes ADD COLUMN source TEXT` with a length `CHECK`.
- `recipes.server.ts`, `shared/recipe.ts`: read, create and update the field.
- `recipeValidation.ts`, `draft.ts`, `draftStore.ts`, `RecipeEditor.tsx`, the edit and new routes: the field, its limit and its error.
- `RecipeView.tsx`: shows the source.
- Seed data (`src/db/seed/dev.sql`): a source on two recipes, so the dev app shows both a text and a link.
- Overlaps with the in-flight `limit-field-sizes` change, which also adds a `0016` migration and rebuilds `recipes`: see design.md.
- Out of scope: the source on recipe cards, filtering or suggesting sources, fetching or checking links, importing a recipe from a link.
