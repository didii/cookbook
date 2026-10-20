# Proposal

## Why

With "Stap toevoegen" and Enter-inserts-a-step gone (`consolidate-step-list-behavior`), a step can only be added at the end, by typing in the empty last step. Putting a step between two others, or before the first, has no way. Steps are ordered instructions, so inserting in the middle is common, unlike ingredients.

## What Changes

- The toolbar of each step gets a "+" button that inserts an empty step above that step and moves focus to it.
- The button is part of the same toolbar Tab stop and arrow-key navigation, and is inert on the empty last step.
- Depends on `consolidate-step-list-behavior` being merged first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-step-editing`: a toolbar button inserts a step above.

## Impact

- `packages/web/app`: `shared/recipeEditor/RowToolbar.tsx` (optional insert button, used only by steps), `StepEditor.tsx`, `StepList.tsx`, `shared/icons`, and tests.
- Ingredient toolbars are unchanged.
