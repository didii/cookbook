# Design

## Context

Specs live in `openspec/specs/<capability>/spec.md` (`family-access`: 10 scenarios, `recipe-storage`: 18). Active changes carry delta specs in `openspec/changes/<name>/specs/<capability>/spec.md` under `## ADDED`, `## MODIFIED` and `## REMOVED Requirements` headings; `view-recipe-from-db` (merged, not yet archived) still has the `recipe-viewing` delta with 5 scenarios. Tests are colocated `*.test.ts` files run by `node --test` through `tsx` (see `add-testing-setup`). Root `scripts` run with plain Node 24, which strips TypeScript types, so the checker needs no dependencies. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A spec change that adds, renames or removes a scenario cannot merge without the matching test change.
- Finding the test for a scenario is one command.

**Non-Goals:**
- No check that a test really asserts the scenario (review does that).
- No test file per capability and no generated tests.

## Decisions

**The link is the test name.** `test('recipe-storage › Duplicate slug is refused', …)`. The capability is the spec directory name; the title is the exact `#### Scenario:` text. Alternatives: a `// spec:` comment (easy to leave stale, invisible in test output) and a `scenario()` wrapper (extra API for the same thing). With names, a failing test in CI output already says which scenario broke. Tests that only cover edge cases of the code and map to no scenario keep free-form names.

**`scripts/spec-check.ts`, plain Node, no dependencies.** Parsing: read `openspec/specs/*/spec.md` and `openspec/changes/*/specs/*/spec.md` (skipping `archive/`); track the current `### Requirement:` heading and the current `## ... Requirements` section; collect `#### Scenario: <title>` lines as `capability › title`. A scenario under `## REMOVED Requirements` is not collected, and a main-spec requirement of the same name is dropped from the set, so removing a requirement removes its tests in the same PR. Scenarios from main and deltas are de-duplicated by key (a MODIFIED delta replaces its main version). Test scanning: every `*.test.ts` under `packages/` (not `node_modules`) is searched with a regex for `test(`, `it(` or `test.todo(` followed by a string starting with `<kebab-case> › `; each hit records the file and line. Alternatives: asking `node --test` for a JSON reporter (needs running every test, and cannot see todos without bodies) and an OpenSpec CLI query (does not list scenarios). Exit code: 1 when a scenario has no test, when a test names an unknown scenario, or when a scenario title appears twice within one capability. Several tests may cover the same scenario.

**Report-only first, then strict.** The script takes `--report` (print everything, always exit 0). Its first commit and the CI step use `--report`; the last task of this change drops the flag once the existing gaps are closed, so the change ends with CI failing on a missing test. This shows the gap list before anything blocks.

**`test.todo` is the escape hatch, and it is visible.** `test.todo('name')` without a body is reported by `node --test` as a todo (`ℹ todo N`) and does not fail the run or change the exit code (verified on Node 24). The script prints the todos as their own section. Scenarios that go through Cloudflare Access or need a browser (sign-in with a one-time code, 30-day session, "reachable on every address") stay todo with the reason in the line above.

**Scenarios are tested at the lowest level that runs the real thing.** Mapping for the current specs:

| Capability | Scenarios | Level |
|---|---|---|
| `recipe-storage` (18) | schema behavior | real in-memory D1 in `migrations/migrations.test.ts` (split per scenario); the two ordering scenarios also in `app/lib/recipes.test.ts` |
| `family-access` (10) | no proof, forged, expired | `app/lib/identity.test.ts` and `workers/handler.test.ts` |
| `family-access` | stand-in locally / on a deployed app | `workers/handler.test.ts` (dev true/false) |
| `family-access` | allowlisted sign-in, unknown email, first visit, returning within session | `test.todo` (Cloudflare Access is outside the code) |
| `family-access` | home page shows who is signed in | `test.todo` until a component or loader-level test exists |
| `recipe-viewing` (5, from the active delta) | existing recipe, order kept, unknown slug | loader-level tests in `app/routes/recipe/route.test.ts` (404 through the thrown `data()` response) |
| `recipe-viewing` | optional fields empty, ingredient without quantity | `test.todo` (rendering needs component tests, deferred) |

This changes the earlier policy of one integration test per endpoint: a loader-level test is now allowed wherever a scenario can only be shown through the loader, and the happy path is still tested once.

**Conventions are written down where agents and people read them.** A short rule in the root `CLAUDE.md` (scenario tests, name format, run `pnpm spec:check`) and the reworded policy in `packages/web/STRUCTURE.md`.

## Risks / Trade-offs

- [A vacuous test with the right name passes the check] → review; stated as out of scope.
- [Renaming a scenario title breaks the test name] → intended; the failure message names the missing title.
- [The check reads active change deltas, so a change under review fails CI until its tests exist] → intended; it also means `view-recipe-from-db`'s delta is checked until that change is archived.
- [The script is outside the typechecked `packages/web` project] → it is small, has its own unit test, and oxlint covers it.
- [This change builds on PR #7 and its working tree] → the branch is stacked on `add-testing-setup`; rebase after the PR #7 review comments are handled.
- [Splitting tests runs the same setup more often] → `migrations.test.ts` already shares one database per file, so splitting is free.

## Migration Plan

1. Land the script in report-only mode and add the CI step with `--report`.
2. Rename, split and add tests until the report is clean (only `test.todo` left).
3. Remove `--report` from the CI step and the `spec:check` script default.
4. Rollback: delete the CI step; the tests keep working with their names.
