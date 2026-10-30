# Design

## Context

`FilterBar` (`routes/home/lib/`) shows the author as one `Chip` per author plus "Iedereen", a sort radio group and a "Wis filters" button in a sheet. `Filters = { q, author?, sort }` lives in `filterRecipes.ts` and maps to `q`, `auteur`, `sort` in the address. `edit-recipe/lib/TagInput.tsx` is a Base UI `Combobox` (multiple, chips, filter ignoring case and accents), but it is in another route and offers "Toevoegen".

## Decisions

**New `home/lib/MultiSelect.tsx`: a Base UI `Combobox` (multiple) over a fixed `options: string[]`, with `value`, `onValueChange`, `placeholder`, `label`.** Same structure as `TagInput` (chips with remove buttons, `Combobox.useFilter({ sensitivity: 'base' })`, picked values left out of the suggestions) minus the "new value" offer. It lives in `home/lib/` (a route may not import `TagInput`). Test ids `MultiSelect-*`; the field is identified by its fieldset (`FilterBar-authors`). Alternative: generalise `TagInput` into `shared/components`; touches the editor and conflicts with the pending `tag-category-in-editor-suggestions`. They can converge later.

**`Filters.author?: string` → `authors?: string[]`.** Matching: no authors, or `sameAuthor` with any. `parseFilters` uses `params.getAll('auteur')` so an old single `?auteur=Oma` gives `['Oma']`; `filterParams` appends one `auteur` per author. `isFiltered` and `activeFilterCount` use `authors.length > 0` (one for the field).

**Picked value not among the options** (an author in a shared link who has no recipe any more): still counts and shows as a chip so the filter is visible and removable; it matches nothing.

**Escape:** the sheet's window `keydown` listener skips an Escape the combobox already handled (`e.defaultPrevented`, set by Base UI when it closes its popup); to be confirmed in the test, otherwise check `aria-expanded` of the focused input. Two presses: first the popup, then the sheet.

**Layout:** the "Van wie" fieldset keeps the legend + control pattern of the sort fieldset; from 48rem it sits on one row with the sort control, below that full width. The input keeps `min-h-12` and 16px text (touch-target rule). `HomePageRoute` still ignores `authors` from the address when there are fewer than 4 recipes. The old `Chip` and its tests go.

## Risks / Trade-offs

- [Combobox popup is portalled next to the on-screen keyboard in a bottom sheet] → rely on Base UI collision handling; `test.todo` for the real-layout check.
- [`tag-manager` also edits `FilterBar.tsx`] → small textual conflict only.
