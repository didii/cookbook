# Proposal

## Why

Steps are the heart of a recipe and, like ingredients, have no way to be typed, ordered or removed in the current form. Writing steps must feel like writing in a notebook: type, press Enter, keep typing. This change builds the step list and, just as important, the text layer that `edit-recipe-chips` needs: an overlay that can underline exact character ranges, and a precise report of what every edit replaced. It is board card #8 ("Create/edit steps"). It builds on `edit-recipe-basics` and, for reordering, on the pieces made in `edit-recipe-ingredients`.

Order: `edit-recipe-basics` → `edit-recipe-ingredients` → this → `edit-recipe-chips` → `edit-recipe-local-save`. Independent of `edit-recipe-picture`.

## What Changes

- A "Bereiding" section in the main column: numbered steps, each a text field that grows with its text, with the step label, a drag grip (mouse/pen), always-visible ↑ ↓ buttons and a delete button in its header, and a "Stap toevoegen" button below the list.
- A step's header buttons are one keyboard toolbar (one Tab stop, arrow keys inside) and Alt+↑/Alt+↓ moves a step from its text; Tab and the plain arrows are never remapped.
- Enter at the end of a step starts the next step and moves there; Enter anywhere else does nothing (steps are one paragraph each); pasted line breaks become spaces; Backspace in an empty step removes it. Deleting a step that has text leaves a slim "Stap verwijderd · Ongedaan maken" row for a few seconds.
- The steps are saved with the recipe, in order, blank ones dropped, replacing the stored steps.
- Groundwork for chips (no visible chips yet): each step's text sits over an identical hidden layer that can mark any character range with an underline or a fill, and every edit to the text is reported as "these characters were replaced by this many new ones" (exact for typing, paste, cut, drop, undo/redo, emoji and IME). `edit-recipe-chips` uses both to anchor chips to text.

## Capabilities

### New Capabilities
- `recipe-step-editing`: writing, reordering, removing and saving the steps of a recipe, plus the mark layer and edit reporting that attach things to step text.

### Modified Capabilities
<!-- none -->

## Impact

- New `app/shared/recipeEditor/StepList.tsx`, `StepEditor.tsx`, `StepText.tsx` (overlay), `app/lib/textEdit.ts` (replaced-range computation), `Draft` gains `steps`, the reorder pieces from the ingredient list move to `shared/recipeEditor/` (second user), `shared/recipeValidation.ts`, `.server/recipes.ts` (`updateRecipe` replaces steps; `createRecipe` already takes them), both route actions and loaders.
- Replacing a recipe's step rows drops the unused `steps.image` and `steps.image_alt` of that recipe (nothing writes them today).
- No schema change, no new dependency.
