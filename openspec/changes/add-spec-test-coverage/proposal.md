# Proposal

## Why

The specs in `openspec/specs/` describe what the cookbook must do, but nothing ties them to the tests. A scenario can lose its test, or a test can keep asserting behavior the spec dropped, without anyone noticing. Requiring a test for every scenario makes a spec change force a test change, so the specs stay true and act as the business rules. See `add-testing-setup` (PR #7) for the test setup this builds on.

## What Changes

- Convention: a test that covers a spec scenario is named `<capability> › <Scenario title>`, using the exact title from `#### Scenario:`. Each test covers one scenario (tests that cover several are split). Tests stay next to the code they exercise; there is no central spec test file.
- A script, `pnpm spec:check`, run as a CI step. It reads every scenario in `openspec/specs/**/spec.md` and in the delta specs of active changes (`openspec/changes/*/specs`), scans the `*.test.ts` files for the names above, prints a scenario to `file:line` map, and fails on a scenario with no test or on a test that names a scenario that does not exist. It starts in report-only mode and is switched to failing once the existing gaps are closed (within this change).
- Scenarios that cannot be automated yet (Cloudflare Access sign-in, session length, rendering that needs component tests) are declared with `test.todo('<capability> › <Scenario title>')`. That satisfies the check, `node --test` reports it as a todo without failing, and the script lists them.
- Existing tests are renamed and split to the convention, and missing tests are added for scenarios that can be tested now (`recipe-storage`, `family-access`, and the recipe-viewing scenarios that the loader can show).
- The testing policy in `packages/web/STRUCTURE.md` is reworded: unit tests for logic and edge cases, each scenario tested at the lowest level that runs the real thing, loader-level integration tests only where a scenario needs them.

Out of scope: judging whether a test is meaningful (review does that), component tests, Vitest.

## Capabilities

### New Capabilities

None. This is tooling and a testing convention; no product behavior changes (`.openspec.yaml` sets `skip_specs: true`).

### Modified Capabilities

None.

## Impact

- `scripts/spec-check.ts` and `scripts/spec-check.test.ts` (new), root `package.json` (`spec:check`, `test` also runs the script's test)
- `.github/workflows/ci.yml` (new step)
- `packages/web/app/lib/identity.test.ts`, `packages/web/workers/handler.test.ts`, `packages/web/migrations/migrations.test.ts`, `packages/web/app/lib/recipes.test.ts`, `packages/web/app/routes/recipe/route.test.ts` (renamed, split, extended; new `test.todo` entries)
- `packages/web/STRUCTURE.md` and the root `CLAUDE.md` (convention and policy)
- Depends on PR #7 (`add-testing-setup`) being merged first.
