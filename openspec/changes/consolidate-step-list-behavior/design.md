# Design

## Context

Ingredients keep their free row in `lib/draft.ts` (`withFreeRow`, applied by `setRows`) and show `RowToolbar` with `disabled` on it. Steps have `withOneStep` (never none) and `addStep`, which `StepList` calls from Enter-at-end and the button. See proposal.md.

## Decisions

- **Mirror `withFreeRow` for steps** (`withFreeStep`, applied after type, remove, restore and move): one trailing blank step, a surplus blank at the end dropped. It replaces `withOneStep`, which it makes redundant. Alternative, a render-only phantom row, was rejected: ingredients do not do that, and a real row keeps focus and ids simple.
- **Typing adds the free step in `editStep`** (text only), so the next step appears while typing, including during IME composition.
- **Enter always asks to focus the next step**, from `StepText`'s key handler; the "cursor at end of text" condition goes. `addStep` is kept (the insert-above change uses it); only its Enter and button callers go.
- **Undo of a delete** still works: `restoreStep` today replaces a lone blank step; with a free step it replaces a lone trailing blank the same way.
- **Inert buttons**: reuse the `disabled` prop of `RowToolbar`, as `IngredientItem` does for its free row.

## Risks / Trade-offs

- Moving a step into the last place would put it below the free step → clamp the target to `length - 2`, as `moveIngredient` does.
- A blank step in the middle (made by clearing text) stays until Backspace; same as ingredients.
