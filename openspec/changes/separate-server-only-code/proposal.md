# Proposal

## Why

Code that must never reach the browser (D1 queries, request identity, the Worker context keys) sits in `app/lib/` next to code that runs on both sides, and `recipes.ts` mixes browser-safe sample data with the `getRecipe` query. Nothing stops a component from importing server code by accident; the folder name should make that a build error instead.

## What Changes

- Add `app/.server/` for server-only modules. React Router (via Vite) fails the build when browser code imports anything in a `.server` directory.
- Move `context.ts` and `identity.ts` (and their tests) from `app/lib/` to `app/.server/`.
- Split `recipes.ts`: the sample data and its `Recipe` type stay in `app/lib/recipes.ts`; `getRecipe` and the stored-row types move to `app/.server/recipes.ts`.
- Update imports (`~/lib/...` to `~/.server/...`) and `STRUCTURE.md` so the layout guidance names `.server/`.

No behavior change.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- `packages/web/app/lib/{context,identity,recipes}.ts` and tests, `app/root.tsx`, `app/routes/{home,recipe}/*`, `workers/handler*.ts`, `STRUCTURE.md`.
- No new dependencies, no spec changes (`skip_specs`): this is a pure refactor.
