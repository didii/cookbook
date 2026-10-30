## Why

A new recipe form that opens already filled is confusing: the family member expects an empty form, or, on the import page, an import box, and instead sees an old draft with only a small line in the save bar saying it was restored. This is worst for the import page, where an old draft hides the import box.

## What Changes

- When the new recipe form or the import page opens and the device holds a draft of an unfinished new recipe, a popup asks first whether to use it. It shows the basics of the draft: photo (if any), name, servings, source, the first few ingredients and the first few steps.
- Choosing to use the draft restores it as before (including the line in the save bar). Choosing to discard removes the draft and opens the form as if there was none (on the import page: the import box).
- Nothing is restored, shown or written until the family member has chosen. Escape does not close the popup: it stays until a choice is made.
- Drafts of stored recipes are not affected: they are still restored without asking.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-draft`: a draft of a new recipe is restored only after the family member chose to use it.

## Impact

- `src/app/routes/edit-recipe/lib/RecipeEditor.tsx`: for a new recipe, the draft read in the mount effect is held back until the choice; the persistence stays off (`ready` false) until then.
- New component `RestoreDraftDialog.tsx` in `src/app/routes/edit-recipe/lib/`, with a test. `draftStore.ts` gets no change.
- Depends on `import-recipe-from-url` for the import page. Its scenario "Imported content is kept as a draft" (recipe-import) says a reload restores the content; with this change the family member picks "use" first. That scenario's wording is not changed here; its test must click the choice.
- Out of scope: asking for drafts of stored recipes, choosing between several drafts, previewing tags, intro or time.
