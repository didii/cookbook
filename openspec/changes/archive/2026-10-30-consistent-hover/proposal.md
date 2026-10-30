# Proposal

## Why

Hover feedback is inconsistent: fields, ingredient rows and some buttons tint, the home page filters and several controls do nothing, and recipe cards lift instead of recoloring. Text links are underlined on hover in some places and not in others. People cannot tell what is clickable. The tag pills on a recipe page are also too small and too close in colour to the page; they are touched here because they need a hover style anyway.

## What Changes

- One hover rule: controls with a background get a slight tint (the tint fields and ingredient rows already use); text-only links and buttons get an underline; links that are already underlined get a slight colour change.
- Home page: the filter toggle, "Wis filters", the sort segments, the multi-select chips and options, and the search field's neighbours get the tint. Cards stop lifting and tint instead.
- Fill the gaps elsewhere: tabs, header title link, site menu, "Voeg het eerste recept toe", the source link, and any other control found missing in the audit.
- Recipe page tag pills: larger text, at least 36px high, white background, tinted on hover.
- New `--color-hover` theme token for the shared tint.

## Capabilities

### New Capabilities
- `hover-feedback`: the one hover rule for clickable things.

### Modified Capabilities
- `recipe-browsing`: the card tints on hover instead of lifting.
- `recipe-viewing`: tag pills on a recipe page are larger, white, and tinted on hover.

## Impact

- `src/app/app.css` (token), `shared/components` (`Button`, `Pill`, `Segmented`), `shared/control.ts`, `routes/home/lib` (`FilterBar`, `MultiSelect`, `RecipeCard`), `routes/recipe/lib` (`RecipeView`, tabs), `routes/layout/lib` (`Header`), `routes/home/HomePageRoute.tsx`, and the tests beside them.
- The tag pills requirement of `add-recipe-view-tags` must be archived first; the `recipe-viewing` delta here adds to it.
- `add-fridge-search` also edits the home page filters; expect small merge conflicts in `FilterBar.tsx`.
