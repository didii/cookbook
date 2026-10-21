## Context

Tests that touch UI run under `node --test` through `tsx` (`packages/web/package.json`), with no browser. Components are rendered with `renderToStaticMarkup` and asserted with regexes on the string. That is static server rendering: effects never run, nothing can be clicked or focused, and attribute order leaks into the assertions. Scenarios that need interaction are `test.todo` with "needs a browser" as the reason.

Test files are `.ts` (the test globs are `**/*.test.ts`), so components are built with `createElement`, not JSX. `cssFor(classes)` in `testing/css.ts` compiles Tailwind for a class string and is used for class-based layout claims.

## Goals / Non-Goals

**Goals:**
- Assert on a DOM through roles, text and attributes, not on HTML strings.
- Automate the interaction scenarios that only need a DOM (click, key press, focus, ARIA state).
- Keep `pnpm test` fast and browser-free.

**Non-Goals:**
- No real-browser tooling (Playwright). Layout, scrolling, viewport width, animation scenarios (a memory router stands in for browser history) stay `test.todo`.
- No change to app code, specs or scenario titles.
- No move of test files to `.tsx` or change to the test globs.

## Decisions

**Libraries: `@testing-library/react` + `@testing-library/dom` + `happy-dom`.** happy-dom is lighter than jsdom and supports what we need (events, focus, `aria-*`, forms). `@testing-library/user-event` is left out; `fireEvent` is enough for clicks and `keyDown`. Add it only if a scenario needs realistic typing or Tab order.

**One setup file, `testing/dom.ts`.** It registers happy-dom globals via `@happy-dom/global-registrator` and calls `cleanup()` in an `afterEach`. Test files import it first, before `@testing-library/react`, because `screen` binds to `document.body` on import. `node --test` runs each file in its own process, so globals do not leak between files. Rejected: registering through a `--import` flag in the test script, since it would add a DOM to loader and database tests that do not need one.

**Keep Node's networking globals.** The registrator replaces `fetch`, `Request`, `Response`, `Headers` and `FormData`. Action and loader tests in the same files use the real ones (`res.headers.get('Location')`). `dom.ts` saves Node's versions before registering and puts them back afterwards.

**`render` + queries replace the HTML helpers.** `shownTitles`, `text()`, `classOf` and the attribute-order alternations become `getAllByRole('link')`, `getByText`, `getByRole('searchbox').value`, `getByRole('button', { name, pressed })` and `el.className`. Order checks use `compareDocumentPosition`. `MemoryRouter` with `initialEntries` stays as the way to set the address.

**`cssFor` stays, fed from `el.className`.** happy-dom does not run Tailwind, so layout claims remain string-level, as today.

**Source-text test replaced by a render.** `Recipe without time or image` renders a card with `time: null` and asserts no time element, instead of grepping `RecipeCard.tsx` for `{r.time && `.

**Todos are converted per component.** A spike (done, files kept outside the repo) showed happy-dom handles the candidates below: the filter sheet (click, Escape, focus back), `IngredientList` keys, focus and the live region, `ChipPopup`, `StepChips` opening the popup, `OpenProposals`, `RecipeEditor` error focus and required marks, and `AuthorInput` ignoring case. A todo whose real test still turns out not to work stays with its reason rewritten to the real limit. Candidates:
- Filter sheet: `Opening the sheet`, `Closing the sheet` (the "search box must not move" part stays browser-only).
- `IngredientList`: Enter, arrow keys, Backspace on an empty row, Alt+arrow, edge rows disabled, row buttons one tab stop (check roving `tabindex`), move announced (live region text).
- `ChipPopup`: open on click, icon switches mode, popup text, Escape closes.
- `OpenProposals`: count in the save bar, jump to the next suggestion.
- `new-recipe`: `Suggestions ignore letter case`, `Required fields are marked`, `Errors are announced and focused` (the visible-asterisk part is a class check).
- `recipe/route`: `Optional fields are empty`, `Ingredient without quantity`.

Staying `test.todo`: two columns and scroll position on wide screens, `Two recipes on one phone screen`, timer docking and animation, `Many chips`, `Nothing shifts when a step is done`, header link on a narrow screen, and `Quantity is highlighted while typing` (computed colour).

## Risks / Trade-offs

- happy-dom is not a browser: focus, selection and the caret are approximate. → Spike first; unsupported cases stay todo with an honest reason.
- Base UI (only `AuthorInput`) does not open its popup from `fireEvent.change` or `click` alone; the spike got it open with `pointerDown`, `mouseDown`, `click` and an `ArrowDown` keydown. → One small helper in `testing/dom.ts` for it. `ChipPopup` is a plain `<dialog>`, so it needs no stubs.
- happy-dom does not know the `<search>` element (a console warning, but it renders). → Query the `searchbox` input, not the landmark.
- `fireEvent` cannot press Tab. → "One tab stop" is checked through `tabindex`; real Tab order stays a todo.
- Three new dev dependencies and a lockfile change. → Accepted for role-based queries and real interaction; `user-event` and jsdom avoided.
- Large diff touching 13 test files. → Convert file by file, one commit per group, and keep the suite green after each.

## Migration Plan

Land after #40, #41 and #42 are merged so the change starts from every scenario they add. Branch `component-testing` is based on `home-5-new-marker` until then; rebase onto `main` once the stack merges. No runtime impact; roll back by reverting the commits.

## Open Questions

None that change the plan. How many todos convert is decided by the per-component spikes.
