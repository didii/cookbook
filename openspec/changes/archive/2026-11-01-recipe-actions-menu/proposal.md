# Proposal

## Why

The recipe page has one text button, "Bewerk", next to the like button. Two more actions are planned for a recipe (copy it, share it), and a row of text buttons does not fit on a phone. One menu button leaves room for them.

## What Changes

- Replace the "Bewerk" link on the recipe page by an icon-only "more" button ("Meer acties") that opens a small popup with three items: "Bewerk", "Kopieer" and "Deel".
- "Bewerk" keeps its behaviour (opens the editor on the stored recipe, discarding a draft).
- "Kopieer" and "Deel" are shown but disabled, until the changes `copy-recipe` and `share-create` enable them.
- The popup closes with Escape, a click outside it, or choosing an item.

## Capabilities

### New Capabilities

- `recipe-actions-menu`: the menu button on the recipe page, the items it offers and how it opens and closes.

### Modified Capabilities

- `recipe-viewing`: the link to the edit form is now an item in the menu.
- `recipe-draft`: the draft is discarded when the editor is opened through the menu item "Bewerk" instead of the "Bewerk" link.
- `hover-feedback`: "Bewerk" is no longer a text link on the page, so it leaves the examples of the underline rule.

## Impact

- `src/app/routes/recipe/lib/RecipeView.tsx` (swap the link for the menu) and its test.
- New sub-module `src/app/routes/recipe/lib/actions/` with the menu component, its icon and tests.
- No loader, database or route change.
- `copy-recipe` and `share-create` build on this change: archive this one first.
