# Tasks

## 1. Real-D1 test harness

- [ ] 1.1 Add `miniflare` as a devDependency of `packages/web`, pinned to the version `wrangler` resolves; verify `pnpm install` leaves a single miniflare in `pnpm-lock.yaml`
- [ ] 1.2 Add `tsx` as a devDependency and change the `test` script to `node --import tsx --test`; verify `pnpm test` still passes unchanged
- [ ] 1.3 Add `test/db.ts` (`createTestDb`) that starts in-memory D1, applies `migrations/*.sql` in order and optionally loads `seed/dev.sql`; verify a smoke test can create it, query `sqlite_master` for the four tables, and dispose
- [ ] 1.4 Move the existing suites next to their sources with `git mv` (`app/lib/identity.test.ts`, `seals.test.ts`, `recipes.test.ts`), fix their relative imports, and rewrite `recipes.test.ts` to use the helper and the seed instead of the fake D1; verify unknown slug gives `undefined`, ingredients and steps come back in position order, and `pnpm test` passes
- [ ] 1.5 Add `migrations/migrations.test.ts` and `seed/dev.test.ts`: migrations apply cleanly, seed loads the expected recipe/ingredient/step counts, and `UNIQUE` slug, `servings > 0`, missing title, `UNIQUE (recipe_id, position)`, `CHECK (amount > 0)` and cascade delete behave as the `recipe-storage` spec says; verify each rejected insert throws and `pnpm test` passes

## 2. Testable Worker handler

- [ ] 2.1 Extract `createFetch` into `workers/handler.ts` and make `workers/app.ts` a thin wrapper that passes the virtual-build request handler and `import.meta.env.DEV`; verify `pnpm typecheck` and `pnpm build` pass and the app still serves a recipe page via `pnpm dev`
- [ ] 2.2 Add `workers/handler.test.ts` unit tests: no identity gives 403 and the app is not called; valid token (local key via injected `getKey`) calls the app with email and env in the router context; dev email honored only when `dev` is true; verify `pnpm test` passes
- [ ] 2.3 Add `app/routes/recipe/route.test.ts`, the single integration test (happy path): the real `loader` from `route.tsx` with a seeded in-memory D1 in the router context returns the recipe for a seeded slug; verify `pnpm test` passes

## 3. CI and docs

- [ ] 3.1 Add `.github/workflows/ci.yml` (ubuntu, Node 24, pnpm 11, frozen install; steps `typecheck`, `lint:check`, `format:check`, `test`, `build`; on pull requests and pushes to `main`); verify the workflow runs green on the PR
- [ ] 3.2 Update `packages/web/STRUCTURE.md`: tests sit next to the file they test (`test/` holds shared helpers only), plus the testing policy (one happy-path integration test per endpoint; logic and edge cases as unit tests; how to run `pnpm test`); drop the "`node --test` does not resolve `~/`" claim from the Imports bullet (tsx does), and verify no remaining text says tests live in `test/`, and confirm `pnpm format:check` and `pnpm lint:check` pass
