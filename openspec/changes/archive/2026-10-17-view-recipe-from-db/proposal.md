# Proposal

## Why

The recipe detail page (`/recepten/:slug`) exists as a design, but renders hard-coded sample data from `lib/recipes.ts`. Now that recipes are stored in D1 (recipe-storage), the page must show the real thing. This is board card #5, "View a recipe".

## What Changes

- The recipe route loads the recipe, its ingredients and its steps from D1 by slug and renders them on the existing page.
- An unknown slug returns a 404.
- The worker exposes the D1 binding to route loaders.
- A small dev-only seed script gives a local database something to view.
- The home page keeps using the sample data; moving it to D1 is card #4 "Browse recipes".

## Capabilities

### New Capabilities
- `recipe-viewing`: A family member can open a recipe and read its title, author, time, servings, intro, image, ingredients and steps in order.

### Modified Capabilities

## Impact

- `packages/web/app/routes/recipe/route.tsx` (loader), `app/lib/context.ts`, `workers/app.ts`.
- New `packages/web/app/lib/` query module and `packages/web/seed/dev.sql`.
- No schema change, no new dependency.
