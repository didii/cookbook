## Context

`app/lib/` holds both browser-safe modules (`tile`, `seals`, sample `recipes`) and server-only ones (`context`, `identity`, `getRecipe`). React Router's Vite plugin already rejects imports of `*.server` files or `.server/` directories from the client bundle, so the separation is enforceable for free.

## Goals / Non-Goals

**Goals:** server-only code lives under `app/.server/`; a browser import of it fails the build; `lib/` keeps only code that runs on both sides.
**Non-Goals:** behavior changes, renaming exports, moving `workers/` code, a new test setup.

## Decisions

- **Directory, not suffix.** `app/.server/` for the whole group instead of `*.server.ts` per file: one rule, matches the card, and tests sit beside their file inside it.
- **`recipes.ts` split by direction.** `Recipe` + `recipes` + `findRecipe` stay in `lib/` (the home route renders them). `RecipeRow`, `IngredientRow`, `StoredRecipe` and `getRecipe` go to `.server/recipes.ts`. `IngredientList.tsx` keeps a type-only import of `StoredRecipe` from `.server/`; type imports are erased, so the client bundle is unaffected. If the build objects, move the types to `lib/`.
- **`context.ts` is server-only.** It only holds the keys the Worker handler sets and loaders read; `root.tsx` and the recipe route use it inside loaders, which React Router strips from the browser bundle.
- **Alias unchanged.** Imports use `~/.server/...`; no tsconfig change expected.

## Risks / Trade-offs

- A top-level import of `.server` code in a component (not a loader) now breaks the build. That is the point; fix by moving the use into a loader.
