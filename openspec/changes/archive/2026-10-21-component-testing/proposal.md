# Proposal

## Why

The web package's route and component tests render with `renderToStaticMarkup` and then assert with regexes on the HTML string (44 uses across 13 test files). These regexes depend on attribute order (`a[^>]*b|b[^>]*a`), slice the string by position, and in one case read a component's source text instead of rendering it. They cannot click, type or focus, so every interaction scenario (keyboard in the ingredient list, the filter sheet, chip popups) is a `test.todo` marked "needs a browser", even though most of them only need a DOM.

## What Changes

- Add React component testing for `node:test`: `@testing-library/react`, `@testing-library/dom` and `happy-dom` as dev dependencies of `packages/web`, with one shared setup in `testing/dom.ts` (DOM globals, cleanup after each test).
- Convert the regex-on-HTML assertions in the route and component tests to role, text and attribute queries on a rendered DOM (`getByRole`, `getByText`, `.value`, `aria-*`), including the attribute-order alternations and the `html.slice(indexOf(...))` position checks.
- Replace tests that read source text (`readFileSync` of `RecipeCard.tsx` in `routes/home/route.test.ts`) with assertions on the rendered output.
- Turn `test.todo` scenarios whose only reason is "needs a browser" for clicks, key presses, focus or live regions into real tests, after a short spike per component to confirm happy-dom is enough.
- Keep as `test.todo` (with the reason updated where needed) the scenarios that need real layout, scrolling, viewport width, animation (browser history is covered with a memory router).
- Keep `cssFor` for class-based CSS claims; the DOM gives it the `className`.
- Update `STRUCTURE.md` ("What to test how") for the new default.

No app code changes and no behavior changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Tooling and test-only change: no requirement or scenario changes, so the change sets `skip_specs: true`. Scenario titles stay the same; only how they are tested changes, and some `test.todo` become tests.

## Impact

- `packages/web/package.json` and `pnpm-lock.yaml`: three new dev dependencies.
- `packages/web/testing/dom.ts` (new) and the `*.test.ts` files that render components: `routes/home`, `routes/recipe`, `routes/welcome`, `routes/edit-recipe`, `routes/new-recipe`, `shared/Header`, `shared/press`, `shared/recipeEditor`.
- `packages/web/STRUCTURE.md`.
- Based on `home-5-new-marker` (PR #42, top of the stack #40, #41, #42) so it covers every scenario those PRs add. Applied after those PRs are complete.
