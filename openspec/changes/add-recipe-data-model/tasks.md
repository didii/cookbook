# Tasks

## 1. Schema

- [x] 1.1 Create `packages/web/migrations/0001_recipes.sql` with `recipes`, `ingredients`, `steps` and `step_ingredients` exactly as listed in design.md; verify `pnpm db:migrate:local` applies it without errors
- [ ] 1.2 Verify every scenario in specs/recipe-storage/spec.md against the local DB with `wrangler d1 execute DB --local` (run from `packages/web`), including refusals (duplicate slug, zero servings, orphan rows, other-recipe link, duplicate link, non-positive amount) and cascades; clean up the test rows afterwards
- [ ] 1.3 Run `pnpm format:fix`, `pnpm lint:fix`, then confirm `pnpm format:check` and `pnpm lint:check` pass
