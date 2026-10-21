# Proposal

## Why

Component tests find elements by role and visible text (`getByRole('button', { name: 'Iedereen' })`, `getByText('Van wie')`, `getByLabelText('Minuten')`; about 130 queries in 19 test files). Rewording a label, translating a string or changing an element's role breaks tests that are not about that wording. Tests should say which element they mean without depending on what the person reads.

## What Changes

- Add a `data-testid` attribute with a hardcoded value to every element a UI test selects. `data-testid` is the Testing Library default, so `getByTestId` works without configuration.
- Name ids `ComponentName-role`, e.g. `FilterBar-search`, `FilterBar-toggle`, `RecipeCard-link`. The prefix is the component that renders the element, so ids are unique across components. Repeated elements share one id and are selected with `getAllByTestId` (and `within`).
- Convert tests to select by test id. Assertions about accessibility (an `aria-pressed` state, a `role="status"` announcement, a focused element, an accessible name that is the scenario itself) keep asserting the attribute or role on the element found by id. They stop using role or text to find it.
- Document the convention in `STRUCTURE.md` ("What to test how").

No behavior change and no change to scenario titles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Test selectors and markup attributes only: no requirement or scenario changes, so the change sets `skip_specs: true`.

## Impact

- App components that tests select on (`routes/home`, `routes/recipe`, `routes/welcome`, `routes/new-recipe`, `routes/edit-recipe`, `shared/Header`, `shared/SiteMenu`, `shared/WorkInProgress`, `shared/recipeEditor`, `shared/press`): one added attribute per selected element.
- The matching `*.test.tsx` files and `testing/dom.test.tsx`.
- `packages/web/STRUCTURE.md`.
- `data-testid` attributes end up in production HTML (a few bytes per element). Accepted; stripping them at build time is not worth a build step.
