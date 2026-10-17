# Proposal

## Why

The only automated tests are three `node --test` suites. The D1 test fakes the database, so the SQL, the migrations and the seed are never executed, and nothing runs on push. A later change can break the schema, a query or the Access check and nobody would notice until deploy. `workers/app.ts` also holds the request wiring (auth, context) but imports `virtual:react-router/server-build`, so none of it can be tested.

## What Changes

- Add a GitHub Actions workflow that runs `typecheck`, `lint:check`, `format:check`, `test` and `build` on pushes and pull requests.
- Add a small test helper that starts an in-memory D1 through Miniflare, applies `migrations/*.sql` in order and can load `seed/dev.sql`. Add `miniflare` as an explicit devDependency of `packages/web`, at the version `wrangler` already resolves.
- Replace the hand-written D1 fake in `test/recipes.test.ts` with the real database. Add tests that migrations apply cleanly, the seed loads, and the key constraints (`UNIQUE` slug, `CHECK` servings and amounts, required fields) reject bad rows.
- Move the request handler out of `workers/app.ts` into a module that does not import the virtual server build (the build is passed in), and unit-test it: no valid identity gives 403 and never calls the app, a valid identity reaches the app with email and env in the router context, the dev stand-in email is honored only when passed in.
- Add `tsx` as a devDependency and run tests with `node --import tsx --test`, so tests can import route modules (JSX, `~/` imports) directly.
- Testing policy for endpoints: one integration test for the happy path; logic and edge cases are covered by unit tests.
- Test files sit next to the file they test (`app/lib/recipes.ts` has `app/lib/recipes.test.ts`), so it is visible at a glance which files have tests. The three existing suites move out of `test/`; `testing/` keeps the shared D1 helper (`testing/db.ts`, with its own smoke test).

Out of scope: Vitest, Playwright and component tests. Separating server-only code from shared code in `app/lib` (`.server/`) is a follow-up (Kanban #33).

## Capabilities

### New Capabilities

None. This is tooling and a behavior-preserving refactor (`.openspec.yaml` sets `skip_specs: true`). The 403 behavior is already specified by `family-access` and the schema by `recipe-storage`; these tests verify them without changing them.

### Modified Capabilities

None.

## Impact

- `.github/workflows/ci.yml` (new)
- `packages/web/package.json` and `pnpm-lock.yaml` (`miniflare` and `tsx` devDependencies, `test` script)
- Tests colocated: `app/lib/*.test.ts` (existing suites moved, `recipes.test.ts` rewritten), `workers/handler.test.ts`, `migrations/migrations.test.ts`, `seed/dev.test.ts`; `testing/db.ts` is the shared D1 helper
- `packages/web/workers/` (handler extracted from `app.ts`; `app.ts` becomes a thin wrapper)
- `packages/web/STRUCTURE.md`: replace the "tests live in `test/`" note with the colocation rule and the testing policy
