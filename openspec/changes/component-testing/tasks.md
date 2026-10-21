## 1. DOM test setup

- [x] 1.1 Add `@testing-library/react`, `@testing-library/dom`, `happy-dom` and `@happy-dom/global-registrator` as dev dependencies of `packages/web`. Verify: `pnpm install` leaves the lockfile consistent and `pnpm test:ai` still passes.
- [x] 1.2 Add `testing/dom.ts`: register happy-dom globals, restore Node's `fetch`, `Request`, `Response`, `Headers` and `FormData`, call `cleanup()` after each test, and export `openAutocomplete(input)` (`pointerDown`, `mouseDown`, `click`, `ArrowDown`) for Base UI. Verify: a small `testing/dom.test.ts` renders an element and finds it by role, cleanup leaves `document.body` empty, and `new Response(null, { status: 303 }).headers` is still Node's.
- [x] 1.3 Update the "What to test how" bullet in `packages/web/STRUCTURE.md`: component tests render into a DOM and query by role and text; regexes on HTML strings are out; `cssFor` takes `el.className`; scenarios needing real layout stay `test.todo`. Verify: `pnpm format:check` passes.

## 2. Home route tests

- [x] 2.1 Convert `routes/home/RecipeCard.test.ts` to a rendered DOM (image class via `getByRole('img')`, tile band after the image via `compareDocumentPosition`). Verify: `pnpm test:ai` passes, scenario names unchanged.
- [ ] 2.2 Convert `routes/home/route.test.ts` (`recipe-browsing` and `recipe-filtering`): replace `shownTitles`, `text()`, the `<output>` count regex, the `<input ... value>` alternations and the `</output>` slice with role and text queries. Replace the `readFileSync('./RecipeCard.tsx')` check in `Recipe without time or image` with a rendered card that has no time element. Verify: `pnpm test:ai` passes and `grep -n "readFileSync\|renderToStaticMarkup" routes/home/route.test.ts` shows nothing outside the loader helpers.
- [ ] 2.3 Convert `routes/home/FilterBar.test.ts`: replace `classOf` and the `aria-pressed` and `checked` regexes with `getByRole('button', { pressed })`, `getByRole('radio')` and `el.className` fed to `cssFor`. Verify: `pnpm test:ai` passes.
- [ ] 2.4 Spike and implement `recipe-filtering › Opening the sheet` and `Closing the sheet` (click Filter, Escape, Filter again, focus returns to the Filter button). If a part needs layout (search box not moving), keep that part as a todo with the reason rewritten. Verify: `pnpm test:ai` passes; no remaining todo says "needs a browser" for click or focus.

## 3. Recipe page tests

- [ ] 3.1 Convert `routes/recipe/RecipePage.test.ts`, `StepList.test.ts`, `TimerCard.test.ts`, `TimerDock.test.ts` and `route.test.ts` (including the `<li` count and the switch `<label>` regex). Verify: `pnpm test:ai` passes, scenario names unchanged.
- [ ] 3.2 Implement `recipe-viewing › Optional fields are empty` and `Ingredient without quantity` from rendered output. Verify: `pnpm test:ai` passes; both are tests, not todos.
- [ ] 3.3 Re-read the remaining todos in these files (columns, scrolling, docking, animation, chips overflow) and rewrite any reason that is vague into the real limit (layout, scroll position, animation). Verify: each remaining todo has a one-line reason naming what a DOM cannot show.

## 4. Editor and form tests

- [ ] 4.1 Convert `shared/recipeEditor/RowToolbar.test.ts` and `routes/edit-recipe/route.test.ts` to DOM queries. Verify: `pnpm test:ai` passes.
- [ ] 4.2 Implement (spike passed; the toolbars have role `toolbar`) the recipe-ingredient-editing scenarios it supports: Enter moves to the next row, arrow keys move between rows, Backspace removes an empty row, Alt and arrow move the row, edge rows disabled, row buttons one tab stop (roving `tabindex`), move announced (live region text). Keep `Quantity is highlighted while typing` as a todo (computed colour). Verify: `pnpm test:ai` passes; todos left in `IngredientList.test.ts` each state a real limit.
- [ ] 4.3 Implement `ChipPopup` and `StepChips` scenarios (a plain `<dialog>`; spike passed): click opens the popup, icon switches mode, popup text, Escape closes. Verify: `pnpm test:ai` passes; any scenario left as a todo says why.
- [ ] 4.4 Implement `OpenProposals` scenarios (count in the save bar, jump to the next suggestion with focus). Verify: `pnpm test:ai` passes.
- [ ] 4.5 Implement the `routes/new-recipe/route.test.ts` scenarios that need only a DOM: `Suggestions ignore letter case` (through `openAutocomplete`), `Required fields are marked`, `Errors are announced and focused` (render `RecipeEditor` in `createMemoryRouter`; spike passed). Verify: `pnpm test:ai` passes; any todo left names the limit.

## 5. Remaining files and wrap-up

- [ ] 5.1 Convert `routes/welcome/route.test.ts`, `shared/Header.test.ts` and `shared/press.test.ts` to DOM queries. Verify: `pnpm test:ai` passes.
- [ ] 5.2 Final sweep. Verify: `grep -rn "renderToStaticMarkup" packages/web/app --include=*.test.ts` finds only tests that deliberately check server output (list each in the PR), `grep -rn "\[\^>\]" packages/web/app --include=*.test.ts` finds nothing, `pnpm test:ai`, `pnpm format:check` and `pnpm lint:check` all pass.
