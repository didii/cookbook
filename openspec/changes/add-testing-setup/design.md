# Design

## Context

Tests run with `node --test` (Node 24 strips types), which resolves neither the `~/` alias nor JSX, so tests import app code by relative path with a `.ts` extension and cannot load `.tsx` route modules (see `STRUCTURE.md`). Today they live in `packages/web/test/`. `test/recipes.test.ts` fakes `D1Database`, so it checks row mapping but not the SQL. `workers/app.ts` builds the request handler from `virtual:react-router/server-build`, a Vite-only module, so it cannot be imported by Node. There is no CI. See proposal.md for motivation.

`wrangler` 4.151 resolves `miniflare@5.20261012.0-beta`, which is already installed (and a second copy would be a duplicate workerd).

## Goals / Non-Goals

**Goals:**
- Tests that execute the real migrations, seed and queries against D1 semantics (SQLite via workerd), with no network and no Cloudflare account.
- The Worker's request wiring is importable and unit-testable under plain `node --test`.
- Every push is checked by the same commands a developer runs locally.

**Non-Goals:**
- No Vitest, `@cloudflare/vitest-pool-workers`, Playwright, component tests or coverage tooling.
- No tests of route components or rendering (component tests are deferred); only a route's `loader` is exercised.
- No `.server/` reorganisation of `app/lib` (Kanban #33).
- No deployment from CI.

## Decisions

**Tests are colocated with the file they test.** `x.ts` has `x.test.ts` beside it, so a missing test is visible in the folder listing. Tests with no single source file sit beside what they cover: `migrations/migrations.test.ts` (schema and constraints) and `seed/dev.test.ts`. `testing/` holds the shared D1 helper (not `test/`, because `node --test` runs every file under a `test/` directory as a test). This is safe for the build: `routes.ts` lists routes explicitly so a test file in `app/routes/` is never a route, Vite bundles only what is imported, and `node --test` finds `*.test.ts` anywhere. `tsc` also type-checks them, which is wanted. The three existing suites move with `git mv`.

**Miniflare directly, not Vitest.** `testing/db.ts` exports `createTestDb({ seed })`: it starts a `Miniflare` instance with one `d1Databases` binding, applies `migrations/*.sql` in filename order, optionally runs `seed/dev.sql`, and returns `{ db, dispose }`. Suites call `dispose` in `after()`. Alternative: the Vitest workers pool, rejected because its latest release needs Vitest 4 and its own older wrangler/miniflare (two workerd copies, one older than production). `miniflare` becomes an explicit devDependency pinned to the version `wrangler` already resolves, so pnpm keeps a single copy and the dependency is not an accident of hoisting.

**`tsx` runs the tests.** `node --import tsx --test` adds a loader that transforms JSX and resolves `tsconfig` `paths`, so tests can import `.tsx` route modules and files that use `~/`, and code can depend on other code freely as the app grows. Alternatives: a hand-written `~/` resolve hook (about 10 lines) does not solve JSX; Vitest solves both but was rejected above. `tsx` is used for tests only, not for the build or the Worker. Existing relative-import tests keep working unchanged.

**SQL files are applied as separate statements.** D1's `exec` treats each line as a statement, so multi-line `CREATE TABLE` would fail. The helper splits the file on `;` at end of line and runs the pieces with `db.batch(prepare(...))`. This relies on no statement containing `;` followed by a newline inside a string; the seed's text has none, and a test that the seed loads the expected row counts would catch a violation.

**Handler factory in `workers/handler.ts`.** `createFetch({ requestHandler, dev, getKey? })` returns the `fetch(request, env)` function: identify, 403 if no email, build `RouterContextProvider` with `userEmailContext` and `envContext`, call `requestHandler(request, context)`. The JWKS set is created lazily inside, as today; `getKey` can be injected so tests can sign tokens with a local key. `workers/app.ts` shrinks to creating the React Router request handler from the virtual build and exporting `{ fetch: createFetch({ requestHandler, dev: import.meta.env.DEV }) }`. `dev` replaces the direct `import.meta.env.DEV` read, which Node does not define. Internal imports in `handler.ts` use `.ts` extensions so Node can load it; if `tsc` rejects that, enable `allowImportingTsExtensions` (already effectively used by the tests). Alternative: test through `app.ts` with a Node loader stub for the virtual module, rejected as more machinery than a parameter.

**Test split follows the stated policy.** Unit tests carry the logic and edge cases, in `workers/handler.test.ts`: handler (403 without identity, 403 never reaches the app, context carries email and env, dev email only when `dev` is true) and the constraints on the real schema. Integration: one test only, the happy path, in `app/routes/recipe/route.test.ts`: call the real `loader` from `route.tsx` with a real in-memory D1 (seeded) in the router context and a seeded slug, expecting the recipe back. The handler's context wiring is covered by its own unit tests, so the integration test calls the loader directly and does not need the Vite-only virtual server build.

**CI is one job on `ubuntu-latest`.** Node 24 and pnpm 11 (matching `volta`), install with a frozen lockfile, then run the root scripts `typecheck`, `lint:check`, `format:check`, `test`, `build` as separate steps so the failing one is obvious. Triggers: pull requests and pushes to `main`. No secrets needed.

## Risks / Trade-offs

- [Miniflare beta in the lockfile can change under a wrangler upgrade] → pin the exact version and update both together; the explicit dependency makes a mismatch visible in the diff.
- [Starting workerd costs a second or two per suite] → one instance per test file, not per test; clean state between tests via transactions of inserts that the test removes, or a fresh helper call for suites that mutate.
- [Naive statement splitting] → documented above; guarded by the seed test.
- [workerd binaries on the CI runner] → `allowBuilds` already permits `workerd` in `pnpm-workspace.yaml`; the first CI run confirms it.
- [`tsx` adds a dependency and a different module loader than production's Vite] → used only for tests; the integration test loads real route code, and `build` in CI still checks the production path.
- [Route components and rendering stay untested] → accepted until component tests are added; typecheck and build still catch structural breakage.
