# Tasks

Visual reference: `docs/design/parsing-rules.html`. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec redesign-parsing-rules-form` lists the delta scenarios still without a test.

## 1. Stored rules

- [ ] 1.1 Change `Rules` and `defaultRules` to `perNumber` and `fixed` (same recognised words as before: minute words 1, hour words 60, spoken → fixed) and make `findTimer` multiply by the stored factor; update `stepParsers.test.ts` and the other tests that build `Rules`, and test "Duration word with its own factor", "New minute word makes a timer" and "New spoken duration makes a timer"
- [ ] 1.2 Make `getRules` convert the old shape (new keys win, missing fields take the defaults) and reject an invalid `perNumber`/`fixed`; test "Default rules", "Unreadable saved rules", "Saved rules without loose units" and "Rules saved before duration rows" in `rules.server.test.ts`

## 2. Validation and saving

- [ ] 2.1 Rewrite `readRules`/`saveRules` for the row input `{ units, looseUnits, degreeWords, durations: { word, minutes, fixed }[] }` with errors per list and per row index (checks as in the design; empty rows and repeats dropped); replace `RulesFields` and `toFields` with the row form of the stored rules; test the validation scenarios of "An admin changes the rules as rows of words" (add, remove, duration per number, spoken duration, minutes missing, word missing, empty list, no duration per number, no loose units, word in two lists, word twice in the durations, loose unit that is also a unit, defaults unchanged, other characters, "Words are not regular expressions") in `rules.server.test.ts`
- [ ] 2.2 Rebuild the `action` of `AdminRulesPageRoute` to read the hidden `rules` JSON field (malformed → 400), return the posted rows with the errors on a refused save, and keep the admin-only checks and the restore intent; test "User opens the page", "User posts a change", "Non-admin cannot restore defaults", "Restore defaults", "Refused save keeps the rows" (action level) in `AdminRulesPageRoute.test.ts`

## 3. Shared row parts

- [ ] 3.1 Move `RowGrip`, `useReorder`, `dropIndex`, `useAfterRender` and `ItemHandle` with their tests from `routes/edit-recipe/lib/shared/` to `app/shared/` and update the imports in `edit-recipe`; verify the type check and the edit-recipe tests still pass unchanged

## 4. Rules page

- [ ] 4.1 Add `RuleRow` and `RuleList` in `routes/admin-rules/lib/` (free last row, `Enter`/`↓`/`↑`, `Alt+↑/↓` keeping the caret, `Backspace` in an empty field, cross, grip drag via `useReorder`, move announcement, compact fields, error message under a row); component-test "Empty row at the end", "Typing adds a row", "Move between rows", "Move a row by keyboard", "Remove an empty row by keyboard" and "Remove a row with the cross", with `RuleRow-*`/`RuleList-*` test ids; mark "Reorder by dragging" as `test.todo` with the reason
- [ ] 4.2 Add the suggestions for the loose units (Base UI `Combobox`, free text allowed, items from the units on the page minus the loose units, `↑/↓/Enter/Esc` while open); component-test "Units are suggested", "Suggestions follow the typing", "Suggestions follow the units list", "Loose unit already filled in", "Take a suggestion" and "Another word is allowed"
- [ ] 4.3 Add the Duur row (minutes field with "min" suffix, "Vast" checkbox, "Vast" wrapping below 40rem) and the page form `RulesForm` (state, hidden `rules` field, errors back on the rows, remount after a save or restore); component-test that a duration row posts its word, minutes and "Vast", "Spoken duration", "Duration per number" (the posted row), and "Refused save keeps the rows" (rendering the errors on their rows)
- [ ] 4.4 Rebuild `AdminRulesPageRoute` on `RulesForm` with the categories Eenheden (units and loose units), Duur and Graden, the bottom bar (`Opslaan` right, `Standaardwaarden herstellen` as a link-style button with confirm on the left) and the saved message; test "Superadmin opens the page", "Admin opens the page", "Save bar", "Restore is confirmed first"; mark the fixed-to-the-bottom layout check as `test.todo` with the reason

## 5. Wrap-up

- [ ] 5.1 Compare the page with `docs/design/parsing-rules.html` in the browser at about 390px and 1000px wide (row keys, suggestions, wrapping of "Vast", the bottom bar), and note any difference in `docs/design/README.md`
- [ ] 5.2 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec redesign-parsing-rules-form`; all clean
