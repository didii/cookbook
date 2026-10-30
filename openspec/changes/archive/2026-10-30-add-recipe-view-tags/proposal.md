# Proposal

## Why

The home page shows a recipe's first two tags, but the recipe page shows none. A family member who opens a recipe cannot see how it is filed.

## What Changes

- Show all tags of the recipe as pills on the recipe page, directly below the picture frame (image and tile band).
- Same pill style as the home card, without the "+N" pill: the list is complete.
- Order is the recipe's own tag order (alphabetical). A recipe without tags shows nothing.
- Each pill is a link to the home page filtered on that tag (`/?tag=<name>`, the address the home filter already keeps).

## Capabilities

### New Capabilities

### Modified Capabilities
- `recipe-viewing`: new requirement that the recipe page lists all tags below the picture frame.

## Impact

- `src/app/routes/recipe/lib/RecipeView.tsx` and `RecipeView.test.tsx`. The recipe loader already returns `tags`; `Pill` is already in `shared/components`.
