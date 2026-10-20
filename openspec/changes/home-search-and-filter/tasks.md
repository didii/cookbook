# Tasks

Five stacked PRs, one per group, in this order. Group 1 branches from `main`; each next group branches from the previous group's branch and its PR targets that branch. Commit after every task. Before each PR: `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai` pass, and `pnpm test:spec home-search-and-filter` shows no missing test for that group's capabilities. Mockup: `docs/design/home.html`

## 1. Button press (branch `home-1-button-press`, PR against `main`)

- [x] 1.1 Create branch `home-1-button-press` from `main`. Add `shared/press.ts` with the one press class string, using exactly the values in design.md ("Press effect"): resting shadow `3px 3px 0` ink, `transition: translate .08s, box-shadow .08s` with default easing (the press moves via `translate`), on `:active:not(:disabled)` `translate: 3px 3px` and `box-shadow: none`, `motion-reduce:transition-none`. Verify with a unit test of the string's key parts, and if the values change during the work, update design.md in the same commit
- [x] 1.2 Apply it to `shared/Button.tsx` and `routes/recipe/TimerChip.tsx`, removing their own press and hover-lift classes, and verify by hand on the recipe page, editor and timers
- [x] 1.3 Check every other element with `shadow-hard*` (`grep`): pressable controls get the class, non-controls (cards, popups) and shadowless controls do not. Verify the list in the PR description
- [x] 1.4 Tests for each `button-press` scenario (timings are not a scenario; they are checked in 1.1) (`button-press › <Scenario title>`; `test.todo` with a reason where a real browser is needed) and verify with `pnpm test:spec home-search-and-filter`
- [x] 1.5 Format, lint, push `home-1-button-press` and open a PR against `main`

## 2. Home layout (branch `home-2-layout`, PR stacked on `home-1-button-press`)

- [x] 2.1 Create branch `home-2-layout` from `home-1-button-press`. In `routes/home/route.tsx` add the heading, the introduction line and the count line ("N recepten", `role="status"`), and verify with a render test of the loader data
- [x] 2.2 In `RecipeCard.tsx` set the image to `h-auto aspect-5/2` below 48rem and `aspect-16/10` from 48rem, and verify with the screenshot at 390px width showing two cards fully
- [x] 2.3 Keep the empty state (message and link, no controls), and verify with the `recipe-browsing › No recipes yet` test
- [x] 2.4 Tests for each new and changed `recipe-browsing` scenario and verify with `pnpm test:spec home-search-and-filter`
- [x] 2.5 Format, lint, push `home-2-layout` and open a PR against `home-1-button-press`

## 3. Recipe filtering (branch `home-3-filtering`, PR stacked on `home-2-layout`)

- [x] 3.1 Create branch `home-3-filtering` from `home-2-layout`. Add `lib/filterRecipes.ts` (`parseFilters`, `filterRecipes`, author list, active-filter count) and `lib/filterRecipes.test.ts`; `RecipeSummary` is extended as needed. Verify the unit tests cover the search, author, combination and sort scenarios
- [x] 3.2 Build `routes/home/FilterBar.tsx`: search box, Filter button with count dot, sheet (chips, sort, "Wis filters"), Escape and toggle closing, `rise` animation, press class on the buttons, dashed and solid chip styles. Verify by hand at 390px against the mockup
- [x] 3.3 Fixed bottom bar below 48rem (safe area, bottom padding on the page, `interactive-widget=resizes-content`, `visualViewport` fallback) and inline bar from 48rem. Verify on an Android and an iOS phone that the bar stays above the keyboard
- [x] 3.4 Wire the URL state (`q`, `auteur`, `sort`, replace navigation, `shouldRevalidate`), the result count "N van M", the no-results state and hiding of chips and sort below 4 recipes. Verify with the scenarios for address, count and no match
- [x] 3.5 Tests for each `recipe-filtering` scenario (`recipe-filtering › <Scenario title>`, `test.todo` with a reason for browser-only ones) and verify with `pnpm test:spec home-search-and-filter`
- [x] 3.6 Format, lint, push `home-3-filtering` and open a PR against `home-2-layout`

## 4. Users (branch `home-4-users`, PR stacked on `home-3-filtering`)

- [x] 4.1 Create branch `home-4-users` from `home-3-filtering`. Add `migrations/0004_users.sql` (`users`: `id`, `email` unique nocase, `calling_name` not blank, `created_at` with the same default as `recipes`, nothing else) and verify `migrations/migrations.test.ts` covers uniqueness in a different case and the blank-name check
- [x] 4.2 Add `.server/users.ts` (`getUser(db, email)`, idempotent `createUser(db, email, callingName)` with `ON CONFLICT DO NOTHING`) and verify with in-memory D1 tests for new, repeated and different-case emails
- [x] 4.3 Add `lib/returnUrl.ts` (accepts only a same-site path, else `/`) with unit tests for `//evil.test`, `https://evil.test`, `/\evil`, `/welkom` and a normal path with a query. Then add `routes/welcome/route.tsx` at `/welkom` (route table entry; loader redirects known members to the return address; action trims and validates the name, creates the user, redirects to the return address) with a welcome screen in the cookbook look, and verify with loader and action tests for the first visit, blank name, submitting twice and continuing to the first requested page
- [x] 4.4 Give the root loader the DB and redirect a member with no user row to `/welkom?returnUrl=<requested path and query>` (not when already there; resource routes unaffected), and verify with a test for the home page and a recipe page on a first visit, and that a known member is not redirected
- [x] 4.5 Tests for each `users` scenario and the modified `family-access` scenario (`users › <Scenario title>`, `family-access › First visit by a new family member`) and verify with `pnpm test:spec home-search-and-filter`
- [x] 4.6 Format, lint, push `home-4-users` and open a PR against `home-3-filtering`

## 5. Recipe new marker (branch `home-5-new-marker`, PR stacked on `home-4-users`)

- [x] 5.1 Create branch `home-5-new-marker` from `home-4-users`. Add `migrations/0005_recipe_views.sql` and verify with a migration test (one row per member and recipe, cascade on delete)
- [x] 5.2 Record the view in the recipe page loader (`INSERT OR IGNORE`) and verify with a loader test: opening twice leaves one row and an unknown recipe records nothing
- [x] 5.3 Extend `listRecipes(db, email, now)` with `isNew` and the named `newForMonths` constant, and verify with in-memory D1 tests: recent unseen, seen, older than a month, own recipe, per member
- [x] 5.4 Pass the signed-in email from the home loader, add the `isNew` prop and the "Nieuw" label to `RecipeCard` (top-left over the image, in the accessible name), and verify with a render test and the screenshot
- [ ] 5.5 Tests for each `recipe-new-marker` scenario (`recipe-new-marker › <Scenario title>`) and verify with `pnpm test:spec home-search-and-filter`
- [ ] 5.6 Format, lint, push `home-5-new-marker` and open a PR against `home-4-users`. Ask which Kanban card these PRs belong to and move it to `review`

## Workflow follow-up

- Merge the PRs in order, from 1 to 5, retargeting each remaining PR to `main` as the one below it merges.
- Archive the change (`/opsx:archive`) after PR 5 is merged, which syncs the delta specs into `openspec/specs`.
