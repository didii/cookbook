# Testing

Where tests live: see `STRUCTURE.md`.

## Levels

- Logic and edge cases get unit tests.
- Test each spec scenario at the lowest level that runs the real thing (e.g. schema against in-memory D1, `identify` with real tokens).
- Loader-level integration test only when a scenario can only be shown through the loader. Call the real `loader` against in-memory D1 with data the test inserted (see `routes/recipe/route.test.ts`).
- Scenario about what a component shows or does: component test.
- Needs real layout, scrolling, viewport width, animation, computed colour or browser history: `test.todo` with the reason on the line above.

## Database tests

- Prefer not to use unless necessary
- Import `test` from `~testing/db` (a drop-in for vitest's). It boots Miniflare once per worker and empties it between users.
- `test.beforeAll(({ testDb }) => ...)`: one database for the tests of a file, emptied when the file is done.
- `test.beforeEach(({ freshDb }) => ...)`: emptied after every test.
- `createTestDb()` boots an instance of its own; use it only when a test needs a different one.

## Component tests

- Render with `~testing/dom` (happy-dom + Testing Library). Import `render`, `screen`, `fireEvent` from there, not from the library.
- Find elements with `getByTestId`. Fire events for clicks and keys.
- Give every selected element a hardcoded `data-testid="ComponentName-role"` (e.g. `FilterBar-toggle`). Name is a component in the same file; `role` is what the element is for, not its ARIA role.
- Repeated elements share the id. Read them with `getAllByTestId` or `within`.
- `testing/testIds.test.ts` enforces the format.
- Accessibility scenarios still assert `aria-*`, roles and focus on the element found by id.
- No regexes on an HTML string.
- Class-based CSS claim: give `el.className` to `cssFor`.

## Naming

- Scenario: one `describe` named `<capability> › <Scenario title>` (exact `#### Scenario:` title). One scenario per `describe`, even with one check.
- Each `test` inside checks one thing and is named for it.
- Other tests: a `describe` per function or behaviour, same way.
- Scenario not automatable yet: `test.todo('<capability> › <Scenario title>')`.

## Running

- `pnpm test` fails on a scenario without a test or a test naming an unknown scenario.
- Tests run on Vitest (`vitest.config.ts`), which resolves `~app/` and JSX. No browser or network needed.
- `pnpm test:ui` opens the Vitest UI in the browser: watch mode, filter by file or name, see failures with their source.
