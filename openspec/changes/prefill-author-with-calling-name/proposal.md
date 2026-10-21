## Why

Every family member types their own name as author on each new recipe. The cookbook already knows their calling name (roepnaam) from the welcome screen, so the field can start filled in.

## What Changes

- The new recipe form opens with the author field prefilled with the signed-in member's calling name.
- The member can still change it, for example to "Oma" when copying her recipe.
- Editing an existing recipe is unchanged: it keeps the stored author.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-creation`: the new recipe form starts with the author set to the member's calling name.

## Impact

- `packages/web/app/routes/new-recipe/route.tsx`: loader reads the user, the editor seed gets the author.
- No schema, API or spec changes outside `recipe-creation`.
