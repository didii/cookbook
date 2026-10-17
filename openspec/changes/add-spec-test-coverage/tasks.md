# Tasks

## 1. The checker

- [x] 1.1 Add `scripts/spec-check.ts` (exported `parseScenarios`, `findTests`, `check`; `main` runs only when executed directly) with `--report`, the `file:line` map, a todo section, and exit code 1 on missing, unknown or duplicate scenarios; add `scripts/spec-check.test.ts` with unit tests on small markdown and test-file fixtures (ADDED/MODIFIED/REMOVED handling, de-duplication, todo recognized, unknown test name, duplicate title) and verify `node --test scripts` passes
- [x] 1.2 Add the root script `"spec:check": "node scripts/spec-check.ts --report"`, make the root `test` script also run `node --test scripts`, and verify `pnpm spec:check` prints the current gaps without failing and `pnpm test` passes
- [x] 1.3 Add a `pnpm spec:check` step to `.github/workflows/ci.yml` after `pnpm test`; verify the workflow file is valid and `pnpm format:check` passes

## 2. Close the gaps

- [x] 2.1 Rename the `identity` and `handler` tests that cover `family-access` scenarios to `family-access › <title>` (no proof, forged, expired, stand-in locally, stand-in on a deployed app), keep edge-case tests free-form, and add `test.todo` entries with a reason line for the Cloudflare Access and rendering scenarios; verify `pnpm test` passes and the report shows no `family-access` gap
- [x] 2.2 Split `migrations/migrations.test.ts` into one test per `recipe-storage` scenario named `recipe-storage › <title>` (18 scenarios, including the ordering ones, which also stay verified through `getRecipe` in `app/lib/recipes.test.ts`); verify `pnpm test` passes and the report shows no `recipe-storage` gap
- [x] 2.3 In `app/routes/recipe/route.test.ts` add loader-level tests named `recipe-viewing › Existing recipe`, `› Order is kept` and `› Unknown slug` (404 from the thrown `data()` response), plus `test.todo` for `› Optional fields are empty` and `› Ingredient without quantity`; verify `pnpm test` passes and the report shows no `recipe-viewing` gap
- [x] 2.4 Make the checker strict: drop `--report` from the `spec:check` script and the CI step; verify `pnpm spec:check` exits 0 on the clean tree and exits 1 after temporarily renaming one test (revert it)

## 3. Docs

- [x] 3.1 Reword the testing policy in `packages/web/STRUCTURE.md` (unit tests for logic and edge cases; each scenario tested at the lowest level that runs the real thing; loader-level integration tests only where a scenario needs them; the `capability › Scenario title` name; `test.todo` for what cannot be automated) and add the short rule to the root `CLAUDE.md` conventions; verify no remaining text says "one integration test per endpoint" and `pnpm format:check` and `pnpm lint:check` pass
