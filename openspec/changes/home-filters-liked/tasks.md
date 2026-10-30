# Tasks

## 1. Filter logic and address

- [x] 1.1 Add `liked` to `Filters`, `filterParams` (`favoriet=1`, omitted when off) and `parseFilters`; verify `filterParams.test.ts` and `filterRecipes.test.ts` cover the address round trip and the default being omitted
- [x] 1.2 Make `filterRecipes` keep only liked recipes when `liked` is set, and count it in `isFiltered` and `activeFilterCount`; verify unit tests for "Showing only favourites", "Favourites and other filters combine", "Favourites count as one filter" and that `noFilters` turns it off

## 2. Filter bar

- [x] 2.1 Add the icon-only "Mijn favorieten" toggle (`aria-pressed`, `aria-label`, maple leaf, red filled when on, yellow hover) to the sort row of the sheet and to the search row from 48rem; verify `FilterBar.test.tsx` covers pressing it, its pressed state and its wiring to `onFiltersChange`
- [ ] 2.2 Rebuild the wide layout per `docs/design/home-filters.html` (full width, search plus toggle row, "Van wie"/"Tags"/"Volgorde" grid with the 64rem drop, dashed footer with "Wis filters" at the right, no panel chrome); verify "Wide screen" in `FilterBar.test.tsx` and a `test.todo` with reason for "Full width" and "Narrower than 64rem"
- [ ] 2.3 Pass `liked` through `HomePageRoute` so "No favourites yet" and "Clearing all filters" work with favourites; verify `HomePageRoute.test.tsx`
- [ ] 2.4 Check the page at 390px, 800px and 1280px against the mockup, then run `pnpm format:fix`, `pnpm lint:fix`, `pnpm test:spec home-filters-liked`, `pnpm test:ai`, `pnpm format:check` and `pnpm lint:check`
