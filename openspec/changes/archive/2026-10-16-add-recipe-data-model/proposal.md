# Proposal

## Why

Recipes only exist as sample data hard-coded in `app/lib/recipes.ts`. The family needs real recipes kept in the D1 database; this is the schema that holds them (board card #2). The model must already allow rescaling portions, showing per step which ingredients it uses, and optional step images, so later changes do not need a schema rewrite.

## What Changes

- Add a D1 migration creating tables for recipes, ingredients, steps and step-ingredient links.
- Ingredients and steps are stored as ordered rows belonging to one recipe.
- Ingredient quantities are stored as the typed text plus an optional numeric amount and unit, so portions can be rescaled later.
- Steps store the ingredients they use (optionally with a partial quantity) and may have an image.
- No app code changes: the routes keep using the sample data until a later change reads from D1. Parsing quantity text, scaling, unit correction and seeding are also later items.

## Capabilities

### New Capabilities
- `recipe-storage`: how recipes, ingredients, steps and the ingredients each step uses are persisted and kept consistent.

### Modified Capabilities

## Impact

- New file `packages/web/migrations/0001_recipes.sql` (the folder only holds `.gitkeep` today).
- Applied via the existing `pnpm db:migrate:local` / `db:migrate:remote` scripts.
