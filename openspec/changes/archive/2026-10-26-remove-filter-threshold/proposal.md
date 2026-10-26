## Why

The author field, tag field and sort control only appear once 4 recipes are stored. A cookbook with fewer recipes shows only the search box, with no "Filter" button on a phone, which looks like the filters are missing.

## What Changes

- Always show the author field, the tag field (when tags exist), the sort control and, on a phone, the "Filter" button, however few recipes are stored.
- Remove `minRecipesForFilters` and the `detailed` prop of `FilterBar`.
- Remove the spec scenario "Few recipes".
- Addresses that set `auteur`, `tag` or `sort` are no longer ignored on a cookbook with few recipes.

## Capabilities

### New Capabilities

### Modified Capabilities

- `recipe-filtering`: the author filter no longer depends on the number of stored recipes.

## Impact

- `src/app/routes/home/HomePageRoute.tsx`, `lib/FilterBar.tsx`, `lib/filterRecipes.ts` and their tests.
- `openspec/specs/recipe-filtering/spec.md` (at archive).
