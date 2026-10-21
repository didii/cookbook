# Tasks

## 1. Convention and guard

- [x] 1.1 Document the `ComponentName-role` / `data-testid` convention in `packages/web/STRUCTURE.md` ("What to test how"): verify by reading the section; it no longer says "query by role and text".
- [x] 1.2 Add the id check test in `packages/web/testing/` (every `data-testid="X"` literal in `app/**/*.tsx` starts with its file's component name and is unique): verify with `pnpm test:ai`; temporarily duplicating an id makes it fail.

## 2. Shared components

- [x] 2.1 Add ids to `Header`, `SiteMenu`, `WorkInProgress`, `press` and the shared `Button` pass-through, and convert `Header.test.tsx`, `SiteMenu.test.tsx`, `WorkInProgress.test.tsx`, `press.test.tsx`, `testing/dom.test.tsx`: verify with `pnpm test:ai`, no `getByRole`/`getByText`/`getByLabelText` left for finding elements in those files.

## 3. Home and welcome

- [x] 3.1 Add ids to `FilterBar`, `RecipeCard` and the home route, convert `FilterBar.test.tsx`, `RecipeCard.test.tsx`, `routes/home/route.test.tsx`: verify with `pnpm test:ai`.
- [x] 3.2 Add ids to the welcome route and convert `routes/welcome/route.test.tsx`: verify with `pnpm test:ai`.

## 4. Recipe view

- [ ] 4.1 Add ids to `RecipePage`, `StepList`, `TimerCard`, `TimerDock` and convert their tests: verify with `pnpm test:ai`.

## 5. Recipe editor and forms

- [ ] 5.1 Add ids to `IngredientList`, `StepChips`, `ChipPopup`, `OpenProposals` and convert their tests: verify with `pnpm test:ai`.
- [ ] 5.2 Add ids to the new-recipe and edit-recipe routes and convert `new-recipe/route.test.tsx`, `edit-recipe/route.test.tsx`: verify with `pnpm test:ai`.

## 6. Finish

- [ ] 6.1 Confirm no test finds elements by role, text or label: `grep -rE "getBy(Role|Text|LabelText|PlaceholderText)|getAllBy(Role|Text)" packages/web/app packages/web/testing` returns only assertions on an element already found by id (justify any that remain).
- [ ] 6.2 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`: all pass.
