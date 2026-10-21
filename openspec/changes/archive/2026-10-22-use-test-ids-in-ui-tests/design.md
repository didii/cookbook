# Design

## Context

Tests render components into happy-dom through `~testing/dom` and query with `getByRole`, `getByText`, `getByLabelText`. Testing Library's `getByTestId` reads `data-testid` by default. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Tests find elements by a stable, hardcoded id that no copy or role change can break.
- Zero collision risk between components.

**Non-Goals:**
- No test-id on elements no test selects.
- No build step that strips the attribute.
- No change to roles, labels or any user-visible behavior.

## Decisions

**Attribute: `data-testid`, not `data-test-id`.** It is the Testing Library default (`getByTestId`), also used by Playwright and Cypress conventions. A custom `data-test-id` would need `configure({ testIdAttribute })` in `testing/dom.ts` for no gain. Say so if `data-test-id` is wanted; it is a one-line config plus a rename.

**Naming: `ComponentName-role`, hardcoded string literals.** `role` is what the element is for in that component (`search`, `toggle`, `sheet`, `link`, `title`), not its ARIA role. Examples: `FilterBar-search`, `TimerCard-pause`. Rejected: nanoids. They are collision-free but unreadable in tests and diffs, and a component name prefix already guarantees uniqueness as long as each component keeps its roles distinct. Rejected: generated ids (`useId`), because tests would need to read them from the DOM.

**Literals, not a helper.** Each id is written inline: `<button data-testid="FilterBar-toggle">`. A `testId()` helper or constants file adds indirection; grep finds a literal.

**Per-item ids stay generic.** Rows in a list share the id (`IngredientList-row`) and tests use `getAllByTestId(...)[i]` or `within(row)`. Data-dependent ids (`row-${id}`) are avoided so the id stays a hardcoded name.

**Uniqueness check is a test.** A test in `testing/` scans `app/**/*.tsx` for `data-testid="..."` literals and fails if a value does not start with the name of its file's component or is declared in two components. This keeps the convention from drifting without lint plugins.

**Accessibility assertions stay.** Finding an element by id and then asserting `getAttribute('aria-pressed')`, `role`, or `document.activeElement` keeps coverage of scenarios that are about accessibility. Only the finding moves to the id.

**Reusable shared components pass the id through.** Where a shared element (`Button`, `Chip`) is used in several places, the caller supplies the id (props already spread to the DOM node; check each) instead of the shared component hardcoding one for all uses.

## Risks / Trade-offs

- Test ids add attributes to production markup. → Tiny; accepted.
- Tests no longer fail when an element loses its accessible name or role. → Scenarios about accessibility still assert the attribute explicitly; do not drop those assertions in conversion.
- Large mechanical diff (about 19 test files plus components). → One commit per group of files, suite green after each.
- Ids can go stale when a component is renamed. → The uniqueness test checks the prefix against the file's component.
