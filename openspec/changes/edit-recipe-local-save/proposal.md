# Proposal

## Why

Typing a recipe takes a while, and the editor stores nothing until "Opslaan". A refresh, a crashed tab, a phone that reloads the page in the background, or simply walking away halfway through a new recipe would lose everything. Saving drafts on the device removes that risk without a server-side "half-written recipe" that the whole family could see. It also lets the leave-page confirmation from `edit-recipe-basics` go away in the normal case, which is one less interruption. This is the last of the six changes: it saves the whole editor state, so it comes after `edit-recipe-chips`; it has no board card of its own.

## What Changes

- While a family member edits, the whole editor state (basics, photo path, ingredients, steps with their chips) is kept in the browser's local storage, a moment after each change and when the page is hidden or closed, per signed-in family member and per recipe (or "new recipe").
- Refreshing, reopening the address, or coming back later restores the draft, for an edit and for a new recipe alike; a notice in the save bar says a draft was restored and when it was saved.
- Starting an edit from the recipe page's "Bewerk" link throws the draft of that recipe away and starts from the stored recipe. The header's "Nieuw recept" link does not: an unfinished new recipe is picked up again.
- A draft ends on a successful save and on "Herstel". It is also not kept while it equals the stored recipe. "Annuleren" only leaves the page; it does not touch the draft.
- If the stored recipe was changed (by someone else, or in another tab) after the draft was started, the editor says so and lets the family member keep the draft or start over from the stored version.
- The "leave this page?" confirmation now appears only when the draft could not be kept on the device (storage unavailable or full). The bar says "Concept bewaard op dit apparaat" while there are unsaved changes that are safe.
- Drafts older than 30 days are removed, and at most 20 are kept.
- A photo that is still uploading is not part of a draft.

## Capabilities

### New Capabilities
- `recipe-draft`: keeping, restoring, discarding and expiring the editor's unsaved state on the device.

### Modified Capabilities
- `recipe-form`: the requirement "Unsaved changes are shown and guarded" (added by `edit-recipe-basics`) changes: the leave confirmation applies only when the draft could not be kept, and the bar says the draft is kept. This change must be archived after `edit-recipe-basics`.

## Impact

- New `app/lib/draftStore.ts` (pure, with an injected storage), `app/shared/recipeEditor/useDraftPersistence.ts`, `RecipeEditor.tsx` (restore, notices, narrowed guard), `routes/edit-recipe` and `routes/new-recipe` (`clientAction` clears the draft after a successful save), the recipe page's "Bewerk" link (marks the navigation as a fresh start), `getRecipe`/edit loader (`updated_at`).
- No schema change, no new dependency, nothing stored on the server.
