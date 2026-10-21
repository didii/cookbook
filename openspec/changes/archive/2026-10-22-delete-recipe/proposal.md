## Why

A recipe that was added by mistake, or is no longer wanted, cannot be removed today. Family members need to be able to delete it themselves.

## What Changes

- Add a "Verwijder recept" button at the bottom of the recipe page, after the steps (the page has no footer; it sits at the end of the page content, not in the header).
- Pressing it opens a confirmation popup naming the recipe, with "Verwijderen" and "Annuleren". Nothing is deleted before the family member confirms.
- The popup closes without deleting on "Annuleren", Escape, or a click outside it.
- Confirming deletes the recipe with its ingredients, steps, chips and views (database cascade), deletes its photo, and takes the family member to the home page.

## Capabilities

### New Capabilities
- `recipe-deletion`: removing a stored recipe, behind a confirmation popup.

### Modified Capabilities

None. `recipe-storage` already requires dependent rows to go with the recipe.

## Impact

- `routes/recipe`: new `action` and a delete button with popup in `RecipePage`.
- `.server/recipes.ts`: new `deleteRecipe`.
- Existing `deletePhoto` in `.server/photos.ts` is reused.
- No migration.
