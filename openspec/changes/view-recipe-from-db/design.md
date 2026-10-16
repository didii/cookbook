# Design

## Context

The route already renders the page from `findRecipe()` sample data. Loaders get no `env`: `workers/app.ts` only puts the user email in the router context. D1 schema is in `migrations/0001_recipes.sql`.

## Goals / Non-Goals

**Goals:**
- Same page and look, real data.

**Non-Goals:**
- Home page, step ingredient links, scaling, per-step images (later cards).
- Fixing the sample `image`/`seal` fallbacks beyond not crashing on null.

## Decisions

- **Expose `env` via a second router context** (`cloudflareEnvContext` in `lib/context.ts`, set in `workers/app.ts`), mirroring `userEmailContext`. Alternative: pass `env` as `loadContext`; the existing context key pattern is already in use.
- **Query in `lib/recipes.ts`**: replace the sample array with `getRecipe(db, slug)` running one `db.batch` of three selects (recipe, ingredients ordered by position, steps ordered by position). The sample array stays as `sampleRecipes` for the home page until card #4.
- **Component props stay close to today's**: map `quantity_text`→`q`, `name`→`item`, `body`→`steps[]`, so `IngredientList` and `StepList` are unchanged. `time` and `image` become nullable in the page; the `TileBand` tile and `seal` fall back (tile by recipe id, seal omitted when null).
- **Dev seed** `seed/dev.sql` copies the six sample recipes; run with `wrangler d1 execute DB --local --file`. Not a migration, never applied to remote.

## Risks / Trade-offs

- Home links to sample slugs that may not exist in D1 → 404 until card #4; seed uses the same slugs.
- Tile chosen by `id` rather than list index → differs from home card tile; acceptable until card #4.
