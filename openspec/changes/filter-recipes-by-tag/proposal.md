# Proposal

## Why

Recipes have tags (`add-recipe-tags`) but the home page cannot use them: the search box ignores them and there is no way to pick one. Board card #48 (part 2 of 2; `author-multi-select` comes first and brings the multi-select field).

## What Changes

- The search box also matches tag names (next to title and author). Placeholder becomes "Zoek op naam, kok of tag".
- The filter sheet gets a "Tags" field: a multi-select with autocomplete over the tags that recipes have; only existing tags can be picked. With tags picked, a recipe is shown when it has **any** of them (OR).
- Tag matches rank: recipes with more of the picked tags come first. Recipes with the same number of matches keep the chosen order ("Nieuwste" or "A–Z") within their group.
- Picked tags are kept in the address (`tag`, once per tag), count once in the "Filter" badge and are cleared by "Wis filters".
- Out of scope: clickable tag pills on the cards, tag categories.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-filtering`: search covers tags; new tag filter and tag-match ranking; address, "Wis filters", sheet (field, count) and wide-screen requirements follow.

## Impact

- `routes/home/`: `lib/filterRecipes.ts` (`Filters.tags`, `tagsOf`, ranking), `lib/FilterBar.tsx`, `HomePageRoute.tsx` and their tests.
- No server, loader or DB change: `listRecipes` already returns each recipe's tags.
- Depends on `author-multi-select` (the `MultiSelect` component, `Filters.authors`, the sheet's Escape handling). Apply it first; this change's delta repeats the full requirement text on top of that change's.
- Textual overlap with the pending `tag-manager` change in `FilterBar.tsx`.
