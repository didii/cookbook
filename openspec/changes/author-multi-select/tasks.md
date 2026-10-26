# Tasks

Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec author-multi-select` lists the delta scenarios still without a test.

## 1. Filter logic

- [x] 1.1 In `filterRecipes.ts` change `Filters.author` to `authors?: string[]` (any-of match); update `isFiltered`, `activeFilterCount`, `parseFilters` (`getAll('auteur')`) and `filterParams` (one `auteur` per author); test "Choosing an author", "Choosing several authors", "Search and author combine", "Opening an address with authors" (parsing, plus a single old `?auteur=Oma`) in `filterRecipes.test.ts`

## 2. The field

- [x] 2.1 Add `home/lib/MultiSelect.tsx` (Base UI `Combobox`, multiple, chips with remove buttons, suggestions ignore case and accents, picked values not suggested, no "new value" offer, `placeholder` shown while nothing is picked); component-test "Finding an author by typing", "Picked author is not suggested again" and "Removing a picked author" through its test ids

## 3. The bar

- [ ] 3.1 In `FilterBar.tsx` replace the author chips and `Chip` by a `MultiSelect` "Van wie" (placeholder "Iedereen"); update `FilterBar.test.tsx`: drop "Selected and unselected chips", change "Active filter count" (two authors and A–Z → 2), add "No author picked", keep "Wide screen" and "Few recipes" green, keep `button-press › Pressing a chip` but point it at a picked chip's remove button
- [ ] 3.2 Make the sheet's Escape handler skip an Escape that closed the suggestions; test "Escape closes the suggestions first" and "Closing the sheet"; mark the phone-keyboard/popup placement check as `test.todo` with the reason

## 4. The page

- [ ] 4.1 In `HomePageRoute.tsx` ignore `authors` from the address when not detailed and make "Wis filters" clear authors; update `HomePageRoute.test.tsx`: "Choosing an author" through the address, "Clearing all filters", "Opening an address with authors", "Few recipes"

## 5. Wrap-up

- [ ] 5.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec author-multi-select`; all clean
