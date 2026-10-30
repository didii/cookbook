# Design

## Context

After `author-multi-select`: `Filters = { q?, authors?, sort? }` in `routes/home/lib/filterRecipes.ts`, a `MultiSelect` field in `home/lib/`, the sheet's Escape handling and `FilterBar` showing the "Van wie" field. `RecipeSummary.tags` (string[]) is already in the loader data.

## Decisions

**`Filters.tags?: string[]`.** A recipe passes when `tags` is empty or it has at least one picked tag (names compared with the same collator as authors, letter case and accents ignored; the existing `sameAuthor` is renamed to a neutral `sameName`).

**Ranking in `filterRecipes`:** after filtering and the chosen sort, when tags are picked, a stable sort by the number of picked tags the recipe has, descending. `Array.prototype.sort` is stable, so ties keep the chosen order. The match count is computed per recipe once (`Map` or inline key) rather than inside the comparator. With no tags picked nothing changes.

**Search also matches tags:** `fold(tag).includes(needle)` for any tag, next to title and author.

**Options:** `tagsOf(recipes)`: each tag once by name (first spelling wins), alphabetical via `sortTags`. The field is hidden when it is empty, on top of `detailed`.

**Address:** `tag` appended once per value, read with `getAll`. A picked tag that no recipe has any more (shared link) still shows as a chip and matches nothing. `HomePageRoute` ignores `tags` when not detailed, like `authors`.

**Filter count:** `activeFilterCount` adds `tags.length > 0`.

**Layout:** the "Tags" fieldset is a second `MultiSelect` next to "Van wie", same legend + control pattern; on 48rem and up the fields and the sort sit in one flowing row, below that stacked and full width. Unit tests for the ranking sit in `filterRecipes.test.ts`; the field tests reuse the `MultiSelect` ones.

## Risks / Trade-offs

- [Ranking reorders the list so "Nieuwste" no longer looks global when tags are picked] → intended; the sort control still decides inside each group.
- [Depends on `author-multi-select`] → apply it first; this change's MODIFIED requirements repeat the full text on top of that change's.
