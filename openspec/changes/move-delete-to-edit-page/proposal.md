# Proposal

## Why

The "Verwijder recept" button sits on the page people read while cooking, one tap from the steps. Deleting is a rare editing action; it belongs on the edit page.

## What Changes

- Remove the delete button and its popup from the recipe page.
- Show them at the bottom of the edit page, after the form and its save bar (the page has no footer). Not on the page for a new recipe, which has nothing to delete.
- The confirmation popup, the deletion and the redirect to the home page stay as they are.
- The delete action moves to its own route `recepten/:slug/verwijderen`, because the edit page already has an action for saving.

## Capabilities

### New Capabilities

### Modified Capabilities
- `recipe-deletion`: the delete button is on the edit page, not the recipe page.

## Impact

- `routes/recipe`: `DeleteRecipe` and its test move out; `RecipeView` and `RecipePageRoute` lose the button and the action; the deletion tests move with the action.
- `routes/edit-recipe`: new `DeleteRecipe` in `RecipeEditor` (stored recipes only); new `RecipeDeleteRoute.ts` and route entry in `routes.ts`.
- Specs: `openspec/specs/recipe-deletion`.
- No migration, no dependencies.
