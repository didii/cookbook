# Tasks

## 1. Text edit reporting

- [x] 1.1 Add `app/lib/textEdit.ts` (`computeEdit` with selection hint and prefix/suffix fallback, snapping to whole code points) with `textEdit.test.ts`; verify tests named `recipe-step-editing › Typing is a one-character insertion`, `recipe-step-editing › Pasting over a selection`, `recipe-step-editing › Cutting removes a range`, `recipe-step-editing › Emoji are never split` (astral characters, ZWJ sequences, a range that would start between surrogates) and `recipe-step-editing › Undo and redo are reported` (no hint, repeated characters) pass.
- [ ] 1.2 Add a `useTextEdit` hook (captures the selection in `beforeinput`, handles `compositionstart`/`compositionend`, calls `onEdit(edit, nextValue)` with `onChange`); verify with the pure parts covered by 1.1 and a `test.todo` named `recipe-step-editing › Input method input is reported when it completes` (a browser and an input method are needed, reason on the line above), and by hand with Windows Japanese or Chinese IME and a phone dictation if available. (Built; the IME and dictation check by hand in a browser is still to do.)

## 2. Text layer

- [ ] 2.1 Build `StepText.tsx` (grid stack of box, mirror and textarea; auto height from the mirror; `<mark>` segments from a `marks` prop using only background and underline; Enter, Shift+Enter, paste and Backspace behaviour; edit reporting via the hook); verify with `test.todo`s (a browser is needed, reason on the line above) named `recipe-step-editing › Marks sit under their characters`, `recipe-step-editing › Marks never move the text`, `recipe-step-editing › Step field grows with its text`, `recipe-step-editing › Enter elsewhere changes nothing` and `recipe-step-editing › Pasted line breaks become spaces`, and by hand with a wrapping mark, a very long word, 200% zoom, narrow and wide widths and a hard-coded test mark in `pnpm dev`. (Built; the by-hand check in a browser (wrapping mark, long word, 200% zoom, widths, test mark in `pnpm dev`) is still to do.)

## 3. Step list

- [ ] 3.1 Extract the arrow pair, the pointer-event drag hook and the announcement region from the ingredient list into `shared/recipeEditor/` and make the ingredient list use them; verify the ingredient tests and behaviour are unchanged (`pnpm test:ai`, and a drag and an arrow move by hand).
- [ ] 3.2 Add `Draft.steps` and the reducer actions (add, remove, move, edit, undo-delete) in `lib/draft.ts` with tests; verify `recipe-step-editing › New recipe starts with one empty step`, `recipe-step-editing › Step can be added with the button`, `recipe-step-editing › Step moves up and down`, `recipe-step-editing › Deleted step can be undone` and `recipe-step-editing › Deleting an empty step is immediate` pass, and that `isDirty` ignores the undo placeholder.
- [ ] 3.3 Build `StepList.tsx` and the step header (numbering, grip hidden under `hover: none`, always-visible arrows with edge disabling and focus kept on the moved step, trash, undo placeholder with 8 s timeout, "Stap toevoegen", Enter-at-end adds a step and focuses it, Backspace in an empty step); verify with `test.todo`s named `recipe-step-editing › Enter at the end starts the next step`, `recipe-step-editing › Backspace removes an empty step`, `recipe-step-editing › Edge steps cannot move out of the list`, `recipe-step-editing › Step can be dragged` and `recipe-step-editing › Step move is announced`, `recipe-step-editing › Step buttons are one tab stop`, `recipe-step-editing › Alt and arrow move the step`, and by hand at 360px and desktop width.

## 4. Save

- [ ] 4.1 Add `readSteps` to `shared/recipeValidation.ts` (trim, line breaks to spaces, drop blanks), extend `updateRecipe` with an optional atomic replace of the step rows, pass steps from both route actions and return stored steps from the edit loader; verify with tests named `recipe-step-editing › Steps are stored in order`, `recipe-step-editing › Blank steps are not stored`, `recipe-step-editing › Saved steps replace the old ones` and `recipe-step-editing › Stored steps come back in the editor`, and that omitting the argument leaves steps untouched.

## 5. Wrap-up

- [ ] 5.1 Run `pnpm test:spec edit-recipe-steps` and verify every delta scenario has a test or a `test.todo`; run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; verify all pass, then write, reorder, delete and undo steps on a new and an existing recipe in `pnpm dev` at 360px and desktop width.
