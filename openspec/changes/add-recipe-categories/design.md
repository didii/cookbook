# Design

## Context

Change 1 of 2; `redesign-recipe-card` depends on it. `listRecipes` in `shared/recipes.server.ts` returns `RecipeSummary` rows for the home page with one query. Migrations are numbered SQL files in `src/db/migrations/` and are tested in `migrations.test.ts`, one `describe` per spec scenario. Dev data comes from `src/db/seed/dev.sql`.

## Goals / Non-Goals

**Goals:**
- A small, normalised model that a later editor can write to without a schema change.
- `listRecipes` returns the categories in the same single query.

**Non-Goals:**
- Any way to edit, filter by or show categories (see proposal).

## Decisions

- **Two tables.** `categories (id, name)` with `name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim(name)) > 0)`, and `recipe_categories (recipe_id, category_id, position)` with primary key `(recipe_id, category_id)`, both foreign keys `ON DELETE CASCADE`. Alternative: a JSON/text column on `recipes`; rejected, a shared table makes filtering by category and renaming a category one row each later. Alternative: tags without an order; rejected, the card shows only the first two, so the order has to be stored.
- **Cascade on the link only.** Deleting a recipe removes its links; the category rows stay (another recipe may use them, and a later editor will offer them as suggestions). Deleting a category is not possible from the app and cascades to its links.
- **One query for the list.** `listRecipes` adds `(SELECT json_group_array(name) FROM (SELECT c.name FROM recipe_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.recipe_id = r.id ORDER BY rc.position)) AS categories` and parses it in the row mapping, like `isNew`. `json_group_array` of no rows gives `[]`, so a recipe without categories needs no special case. D1 supports the JSON functions.
- **Type.** `RecipeSummary` gets `categories: string[]`. Existing fixtures that build a `RecipeSummary` get `categories: []`.
- **Migration number.** The next free number when this is applied. The unmerged `store-*-quantities` changes plan 0009 to 0011; if they are not merged yet, check the folder and take the next number.
- **Seed.** `dev.sql` starts with `DELETE FROM recipes;`; add `DELETE FROM categories;` and insert a handful of categories (for example Hoofdgerecht, Nagerecht, Soep, Winter, Bakken, Snel) linked to the seeded recipes with 0 to 3 each, including a recipe with none.

## Risks / Trade-offs

- A recipe saved through the editor keeps its categories because `updateRecipe` never touches the link table. → Covered by not changing those functions; a test is not needed until an editor writes categories.
- Numbering clash with the other open changes. → See "Migration number".

## Migration Plan

Additive: two new tables, no change to existing rows. Rollback is dropping the two tables. Production data gets no categories until an editor exists.
