# Tasks

Per CLAUDE.md: test names follow the spec scenarios, run `pnpm test:spec add-fridge-search` to see what lacks a test, and finish each group with `pnpm format:fix`, `pnpm lint:fix`, `pnpm test:ai`.

## 1. Staples storage

- [x] 1.1 Add `shared/staples.ts` (default staples) and `shared/staples.server.ts` (`getStaples`, `readStaples` with validation, `saveStaples`, `resetStaples`) on the `settings` table; verify with `staples.server.test.ts` for the scenarios "Default staples", "Unreadable list", "A saved list replaces the defaults", "A saved empty list means no staples", "Repeated staple", "Other characters", "Too long a word" and "Too many staples" at function level.

## 2. Card and list input

- [x] 2.1 Move `RecipeCard` and its test to `shared/components/`, export it from `components/index.ts`, point home at it; verify `pnpm test:ai` still passes for home and the card.
- [x] 2.2 Give `RecipeCard` an optional `footer` (inside the link area, under the tags) and `children` (below a separator, outside the link area); verify in `RecipeCard.test.tsx` that the footer is part of the link area, the children are not, and that home's output is unchanged.
- [x] 2.3 Write `routes/fridge/lib/IngredientList.tsx` (label, input, +/− button, removable chips; Enter or button adds, trims, ignores empty and duplicates, empties the input and keeps focus; cross removes and focuses the input); verify with `IngredientList.test.tsx` for "Adding with Enter", "Adding with the button", "Adding several in a row", "Empty text", "The same word twice" and "Removing a chip".

## 3. Staples on the rules page

- [x] 3.1 Add `staples` to `RulesRows` and a "Basisproducten" `Section` with a `RuleList` after "Graden" in `RulesForm.tsx`; the action reads, validates and saves it with the other lists (nothing stored when any list is faulty) and `reset` also resets the staples; verify with `AdminRulesPageRoute.test.ts` for "A user posts staples", "Saved with the other lists", "A refused save keeps the staples too", "Restore also restores the staples" and the error scenarios, and `RulesForm.test.tsx` for "The page has the staples", "Adding a staple", "Removing a staple" and the page scenarios of `parsing-rules` ("Superadmin opens the page", "Admin opens the page", "Restore is confirmed first").
- [x] 3.2 Add the link "Koelkast" (after "Home", everyone) to `SiteMenu.tsx`; verify with `SiteMenu.test.tsx` for the menu scenarios of `site-menu` and "Fridge link".

## 4. Matching and address

- [x] 4.1 Write `routes/fridge/lib/matchIngredients.ts` (`words`, `matches`, `rankRecipes` returning used, unused and missing per recipe, narrowing and ordering) and `lists.ts` (`parseLists`, `listParams`, `addEntry` moving a word between lists); verify with unit tests named for "A whole word matches", "Part of a word does not match", "Case and accents are ignored", "An entry of several words", all scenarios of "The lists narrow and order the recipes", "A word moves to the other list" and the address scenarios.
- [x] 4.2 Add `listIngredientNames(db)` to `shared/recipes.server.ts`; verify with a database test that names come per slug in recipe order.

## 5. Fridge page

- [x] 5.1 Write `routes/fridge/lib/MissingIngredients.tsx` (rows with quiet +/−, five rows and "+N meer") and `UnusedEntries.tsx` (struck through, "(niet in dit recept)" for screen readers); verify with component tests for "Missing ingredients", "Many missing ingredients", "Nothing missing", "Unused entries are struck through", "Screen readers get the reason", "All entries used".
- [x] 5.2 Write `routes/fridge/lib/FridgeCard.tsx` (shared card, count in the link area, plain part below the separator); verify "Count of used entries", "No Heb ik entries", "Plain part is separate", "Buttons do not open the recipe", "Adding a missing ingredient to Heb ik" and "Excluding a missing ingredient" at component level with the callbacks.
- [x] 5.3 Write `FridgePageRoute.tsx` at `koelkast` in `routes.ts`: loader (recipes, ingredient names, staples), lists and sort from the address with `replace`, `shouldRevalidate` skipping search-only changes, count line, empty and nothing-found states, "Wis alles"; verify with `FridgePageRoute.test.tsx` and a loader test for "Opening the page", "No recipes stored", "Opening an address with lists", "Changing a list does not fill the history", "Count with a list", "Count without a list", "Nothing found", "Clearing everything", "Choosing the order".
- [x] 5.4 Style the page after `docs/design/koelkast.html` (lists on top and not fixed, stacked below 48rem, 48px inputs, tint on hover without raising); verify the layout and hover scenarios with `cssFor`/`mediaFor` where the checks allow and `test.todo` with the reason on the line above for "Scrolling on a phone", "Hover tints, not raises"; open the page next to the mockup at 390px and 1000px and fix differences.

## 6. Finish

- [x] 6.1 Run `pnpm test:spec add-fridge-search` and confirm no scenario lacks a test; run `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`.
- [x] 6.2 Update `docs/design/README.md` where the built page differs from the mockup, if it does.

## Workflow follow-up

- Archive `add-home-menu-item` before archiving this change (both modify `site-menu`).
- Open the PR and move the board card to `review`.
