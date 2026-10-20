# Proposal

## Why

Ingredients and steps are both lists a family member fills by typing, but they behave differently. In ingredients, Enter moves to the next row and an empty row is always visible at the end. In steps, Enter at the end of a step inserts a new step and a "Stap toevoegen" button adds one. Two ways to do the same thing make the editor harder to learn.

## What Changes

- The step list always ends with one empty step, like the ingredient list; typing in it adds the next empty one.
- Enter in a step always moves focus to the next step (never inserts one, never needs the cursor at the end); in the last, empty step it does nothing.
- **BREAKING**: the "Stap toevoegen" button is removed.
- The buttons of the empty last step are shown but inert, like the empty ingredient row.
- Backspace in an empty step that is not the last still removes it. Deleting the last step with text leaves the empty step.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-step-editing`: the free trailing step, Enter moving to the next step, no add button.

## Impact

- `packages/web/app`: `lib/draft.ts` (free trailing step, as `withFreeRow` does for ingredients), `shared/recipeEditor/StepList.tsx`, `StepEditor.tsx`, `StepText.tsx` (Enter handling), and their tests.
- `docs/design/recipe-editor.html` mentions "Stap toevoegen".
- No database or API change; blank steps were already not stored.
