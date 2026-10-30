# Proposal

## Why

Family members cannot narrow the home page to the recipes they marked as favourite, although the like exists (`recipe-like`). The wide-screen filters also leave most of the content width unused and "Wis filters" sits against the edge of its block; the approved redesign in `docs/design/home-filters.html` fixes both.

## What Changes

- Add an icon-only favourites toggle ("Mijn favorieten", maple leaf) that keeps only the member's liked recipes. It combines with search, authors and tags, is kept in the address (`favoriet=1`), is cleared by "Wis filters" and counts as one active filter on the phone's "Filter" button.
- Phone: bar and sheet stay as they are; the toggle sits at the right edge of the sheet, on the "Volgorde" row.
- From 48rem: redesign the inline filters over the full content width: search takes the free width with the toggle right of it; "Van wie" and "Tags" share the width and "Volgorde" keeps its own (its own row below 64rem); a footer with a dashed line and "Wis filters" at the right. No panel background, border or shadow.

## Capabilities

### New Capabilities

### Modified Capabilities

- `recipe-filtering`: new requirement for the favourites filter; changed requirements for the filter sheet (toggle and count), the wide-screen layout, "Wis filters" and the address.

## Impact

- `src/app/routes/home/lib/FilterBar.tsx`, `filterRecipes.ts` (filter and count), `HomePageRoute.tsx` (empty-state button), `src/app/shared/filterParams.ts` (`Filters`, address).
- Tests beside those files; `RecipeSummary.liked` already exists, so no loader or database change.
- `docs/design/home-filters.html` is the design reference.
