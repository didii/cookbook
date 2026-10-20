# Tasks

## 1. Draft

- [x] 1.1 Add `withFreeStep` to `lib/draft.ts` and apply it in `editStep`, `removeStep`, `restoreStep` and `moveStep` (move target clamped before the free step); drop `withOneStep`. Verify with `lib/draft.test.ts` cases for each, via `pnpm test:ai`.

## 2. Editor

- [x] 2.1 `StepText`/`StepEditor`/`StepList`: Enter moves focus to the next step wherever the cursor is and does nothing in the last; remove the "Stap toevoegen" button; pass `disabled` to the toolbar of the empty last step. Verify in the running app: Enter, typing in the last step, Backspace, delete and undo.
- [x] 2.2 Update `docs/design/recipe-editor.html` to drop the button. Verify with a search for "Stap toevoegen" finding nothing outside the archive.

## 3. Spec tests

- [x] 3.1 Add or update tests named `recipe-step-editing › <Scenario title>` for every scenario of the delta, and remove the tests of the removed scenarios ("Step can be added with the button", "Enter at the end starts the next step", "Enter elsewhere changes nothing"). Verify with `pnpm test:spec consolidate-step-list-behavior` and `pnpm test:ai`.
- [x] 3.2 Run `pnpm format:fix` and `pnpm lint:fix`, then confirm `pnpm format:check` and `pnpm lint:check`.
