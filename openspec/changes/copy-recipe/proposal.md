# Proposal

## Why

Making a variation of a recipe (or one's own version of someone else's) means retyping everything. A copy that opens the new-recipe form already filled in saves that, and the original stays untouched.

## What Changes

- The menu item "Kopieer" is enabled. It opens the new-recipe page at `/recepten/nieuw?kopie=<slug>`, with every field of that recipe filled in: title, author, servings, time, intro, source, photo, tags, ingredients and steps (with their ingredient chips, oven temperatures and timers).
- Nothing is stored until the member saves; saving creates a new recipe like any other new one (own slug, own seal, the member as creator).
- A copy never shares the original's photo file: the saved copy gets its own copy of the photo, so deleting one recipe does not remove the other's photo.
- Opening the copy replaces an unfinished new-recipe draft, as the "Bewerk" item does for an edit draft.
- An unknown `kopie` slug just gives the empty form.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-creation`: a new recipe can start as a copy of a stored one, and no two recipes share a photo.
- `recipe-actions-menu`: "Kopieer" is no longer disabled.

## Impact

- `routes/edit-recipe/NewRecipePageRoute.tsx` (loader reads `kopie`, builds the seed with the mapping the edit page uses; action copies a photo another recipe already uses), `NewRecipeForm.tsx` (seed from the loader), `shared/photos.server.ts` (`copyPhoto`).
- `routes/recipe/lib/actions/RecipeActionsMenu.tsx` (working "Kopieer").
- Needs `recipe-actions-menu` archived first. Independent of the sharing changes.
