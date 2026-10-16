# Tasks

## 1. Data access

- [x] 1.1 Add `cloudflareEnvContext` to `lib/context.ts`, set it in `workers/app.ts`; verify `pnpm typecheck` passes
- [ ] 1.2 Add `getRecipe(db, slug)` to `lib/recipes.ts` returning the recipe, ordered ingredients and steps (or `undefined`); keep the sample array for the home page; add `test/recipes.test.ts` with a fake `D1Database` covering found, missing and ordering; verify `pnpm --filter @cookbook/web test` passes
- [ ] 1.3 Add `packages/web/seed/dev.sql` with the six sample recipes; verify `wrangler d1 execute DB --local --file seed/dev.sql` runs after `pnpm db:migrate:local`

## 2. Page

- [ ] 2.1 Make the recipe route loader use `getRecipe`, throw 404 for an unknown slug, and handle null time/image/seal; verify with `pnpm dev` that `/recepten/appeltaart` shows seeded data and `/recepten/nope` returns 404 (spec scenarios in specs/recipe-viewing)
- [ ] 2.2 Update the Capabilities line in `packages/web/PRODUCT.md` if it still says the recipe data is undefined; verify by reading it
- [ ] 2.3 Run `pnpm format:fix`, `pnpm lint:fix`, then confirm `pnpm format:check` and `pnpm lint:check` pass
