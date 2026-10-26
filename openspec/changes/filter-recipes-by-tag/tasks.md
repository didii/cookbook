# Tasks

Apply after `author-multi-select`. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec filter-recipes-by-tag` lists the delta scenarios still without a test.

## 1. Filter logic

- [x] 1.1 In `filterRecipes.ts` add `Filters.tags?: string[]`; match tags in the search text; filter any-of; rank by number of picked tags after the chosen sort (stable); add `tagsOf(recipes)` (each tag once, alphabetical); update `isFiltered`, `activeFilterCount`, `parseFilters` and `filterParams` (`tag` repeated); test "Searching by tag", "Choosing a tag", "Choosing several tags", "Search and tags combine", "More matches first", "Same number of matches keep the chosen order" and "Opening an address with tags" (parsing) in `filterRecipes.test.ts`

## 2. The bar

- [x] 2.1 In `FilterBar.tsx` add a "Tags" `MultiSelect` (new prop `tags`, hidden when empty) next to "Van wie"; change the search placeholder to "Zoek op naam, kok of tag"; update `FilterBar.test.tsx`: "Active filter count" (two authors, one tag, A–Z → 3), "Wide screen" (both fields visible), and the field scenarios "Finding a tag by typing", "Unknown text is not offered", "Removing a picked tag", "No tags stored"

## 3. The page

- [ ] 3.1 In `HomePageRoute.tsx` pass `tagsOf(recipes)` to the bar, ignore `tags` from the address when not detailed and make "Wis filters" clear tags; update `HomePageRoute.test.tsx`: "Choosing a tag" through the address, "Clearing all filters", "Opening an address with tags"

## 4. Wrap-up

- [ ] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec filter-recipes-by-tag`; all clean
