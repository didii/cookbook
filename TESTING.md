# Testing

Where tests live: see `STRUCTURE.md`.

## Levels

- Logic and edge cases get unit tests.
- Test each spec scenario at the lowest level that runs the real thing (e.g. schema against in-memory D1, `identify` with real tokens).
- Loader-level integration test only when a scenario can only be shown through the loader. Call the real `loader` against in-memory D1 with data the test inserted (see `routes/recipe/route.test.ts`).
- Scenario about what a component shows or does: component test.
- Needs real layout, scrolling, viewport width, animation, computed colour or browser history: `test.todo` with the reason on the line above.

## Stay inside the unit

A unit's contract is its props or parameters and its output. A test checks that contract and nothing a collaborator owns. A spec scenario that asks for a check overrides this.

- **Parent tests** assert that a child is present, where it sits, and that it gets the right props or data. Roles, `aria-*`, copy and callbacks of the child belong in the child's own test. If the child has no test yet, write it.
- **Do not reach into a child's markup** with its ids, tag names or concatenated text (`'100 gsuiker'`). Give the child testids for its parts and read those.
- **Do not test a hook or helper through a component** that uses it. Test it in its own file (a POST body belongs to the hook's test, not to the panel that calls it).
- **Copy:** assert that a message exists, or that the wiring holds (the field that has the error, the label that is set). Assert exact text only where a spec names it. When the text comes from a function, build the expected value with that function (`formatCountdown`, `switchText`).

## Shared state

- `~testing/dom` empties `localStorage` and `sessionStorage` after every test. A test must not clear them itself, and must not rely on what an earlier test stored. If a test only passes after a manual `clear()`, find the store that leaks.
- Do not wait on the clock: no `setTimeout` or fixed sleep in a test, because a loaded machine makes the timing flaky. Wait for the thing you assert with `findBy*` or `waitFor` (both from `~testing/dom`), or flush with `await act(async () => {})` when you assert that nothing happened. Use fake timers when the code under test uses a timer.
- Every other global a test changes (`fetch`, `matchMedia`, the viewport, fake timers) is restored in `afterEach` in the same file.

## Database tests

- Prefer not to use unless necessary
- Import `test` from `~testing/test` (a drop-in for vitest's). It boots Miniflare once per worker and gives the test the fixtures `db` (D1 with the migrations applied) and `photos` (R2 bucket): `test('...', async ({ db }) => ...)`.
- Both fixtures are test-scoped: a test starts with an empty database and bucket, and they are emptied again after every test that asked for them. Tests never see each other's data, so each test inserts what it needs.
- Seed with a helper the tests call, or in `test.beforeEach(async ({ db }) => ...)` (also inside a `describe`). Do not seed in `beforeAll`: suite-level hooks cannot get a test-scoped fixture, and the data would be gone after the first test.
- Clearing costs time on each test (a `SELECT` and one `DELETE` per table), so a test that needs no database must not ask for `db`; the fixture is only created when requested.

## Component tests

- Render with `~testing/dom` (happy-dom + Testing Library). Import `render`, `screen`, `fireEvent` from there, not from the library.
- Find elements with `getByTestId`. Fire events for clicks and keys. Use `getByRole` only for a role the element really has and the test is about (a heading level, a button list).
- No raw selectors (`querySelector('dialog')`, `[data-roving]`, `input[name=…]`) and no tag-name checks (`tagName === 'B'`). If an element is worth testing, give it a testid.
- Give every selected element a hardcoded `data-testid="ComponentName-role"` (e.g. `FilterBar-toggle`). Name is a component in the same file; `role` is what the element is for, not its ARIA role.
- Repeated elements share the id. Read them with `getAllByTestId` or `within`.
- `testing/testIds.test.ts` enforces the format.
- Accessibility scenarios still assert `aria-*`, roles and focus on the element found by id.
- No regexes on an HTML string.
- Never assert on a class name (`classList.contains('sticky')`, `/max-h/` on `className`). Class names are how the style is written, not what it does.
- CSS claim: give `el.className` to `cssFor` (`~testing/css`) and assert the resolved declaration (`position: sticky`, `background-color: var(--color-red)`). Use `mediaFor` for a media query and `hidesAt` for "hidden at this width". Do not match selector shapes (`.fixed \{ … \}`, `aria-pressed[^{]*\{`); a state-dependent rule that needs a browser to resolve is a `test.todo`, or only checks that the declaration exists.
- Do not read `app.css` or other source files in a component test. A token claim gets its own test beside the file (`app.css.test.ts`).

## Naming

- Scenario: one `describe` named `<capability> › <Scenario title>` (exact `#### Scenario:` title). One scenario per `describe`, even with one check.
- Each `test` inside checks one thing and is named for it.
- Other tests: a `describe` per function or behaviour, same way.
- Scenario not automatable yet: `test.todo('<capability> › <Scenario title>')`.

## Running

- `pnpm test` fails on a scenario without a test or a test naming an unknown scenario.
- Tests run on Vitest (`vitest.config.ts`), which resolves `~app/` and JSX. No browser or network needed.
- `pnpm test:ui` opens the Vitest UI in the browser: watch mode, filter by file or name, see failures with their source.
