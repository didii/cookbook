# Proposal

## Why

The "Van wie" filter on the home page shows one chip per author plus "Iedereen" and allows only one author at a time. With many authors the chips take a lot of room, and "Oma or Papa" cannot be asked. Board card #48 (part 1 of 2; `filter-recipes-by-tag` follows).

## What Changes

- "Van wie" becomes a multi-select with autocomplete over the authors. Typing narrows the suggestions (letter case and accents ignored), picked authors show as removable chips. Empty means everyone ("Iedereen" is the placeholder); several authors show recipes by **any** of them.
- The author chips and the "Iedereen" chip go.
- `auteur` in the address is repeated per picked author; an old `?auteur=Oma` link still works. "Wis filters" clears all picked authors; the "Filter" badge counts the author field once, however many are picked.
- Escape inside the sheet: with the suggestions open the first Escape closes only those, a second one closes the sheet.
- A reusable multi-select field in the home route, which the tag filter (next change) uses too.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-filtering`: the author filter becomes a multi-select (any of); address, "Wis filters", sheet (Escape, count) and wide-screen requirements follow; the "Chips show their state by line style" requirement is removed (no author chips left).

## Impact

- `routes/home/`: `lib/FilterBar.tsx`, `lib/filterRecipes.ts` (`Filters.author` → `authors`), new `lib/MultiSelect.tsx` (Base UI `Combobox`), `HomePageRoute.tsx` and their tests.
- No server, loader or DB change.
- Textual overlap with the pending `tag-manager` change, which moves the sort control out of `FilterBar.tsx`; whichever lands second resolves it.
- `filter-recipes-by-tag` builds on this change; apply this one first.
