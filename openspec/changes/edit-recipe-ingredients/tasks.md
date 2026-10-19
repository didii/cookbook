# Tasks

## 1. Parser

- [x] 1.1 Add `app/lib/ingredients.ts` (`parseIngredient`, `joinIngredient`, the unit list) with `ingredients.test.ts`; verify tests named `recipe-ingredient-editing › Quantity with unit and name`, `recipe-ingredient-editing › Quantity without unit`, `recipe-ingredient-editing › Fraction and decimal comma`, `recipe-ingredient-editing › Unknown word after the number is part of the name` and `recipe-ingredient-editing › No quantity` pass, plus ranges (`2-3`), `1 ½`, a trailing dot (`2 el.`), leading spaces and an input that is only a number.

## 2. Server: validate and store

- [x] 2.1 Add `readIngredients` and per-row validation to `shared/recipeValidation.ts` (blank rows dropped, quantity without name refused, server-side parse) with tests; verify `recipe-ingredient-editing › Blank rows are not stored` and `recipe-ingredient-editing › Quantity without a name is refused` pass.
- [x] 2.2 Extend `updateRecipe` with an optional atomic replace of the ingredient rows (same batch as the update) and make both route actions pass the parsed ingredients to `createRecipe` / `updateRecipe`; verify with tests in `recipes.test.ts` named `recipe-ingredient-editing › Ingredients are stored in order` and `recipe-ingredient-editing › Saved list replaces the old one`, and that omitting the argument leaves ingredients untouched.
- [ ] 2.3 Return stored ingredients as editor lines from the edit loader; verify with a loader test named `recipe-ingredient-editing › Stored ingredients come back as lines` (an ingredient with an empty quantity comes back as just its name).

## 3. Editor section

- [ ] 3.1 Build `Draft.ingredients`, the normalising "one empty trailing row" function and the reducer actions (type, add, remove, move) in `lib/draft.ts` with tests; verify `recipe-ingredient-editing › Empty row at the end`, `recipe-ingredient-editing › Typing adds the next row`, `recipe-ingredient-editing › Row can be removed` and `recipe-ingredient-editing › Row moves up and down` pass, and that `isDirty` treats the trailing empty row as no change.
- [ ] 3.2 Build `IngredientList.tsx` and the row (mirror-over-input colouring with `scrollLeft` sync, Enter, ArrowUp/ArrowDown and Backspace handling (Tab is never remapped), delete button, stacked always-visible arrows with edge disabling and focus kept on the moved row, usage-line slot, per-row error, live-region announcements); verify with `test.todo`s (a browser is needed, reason on the line above) named `recipe-ingredient-editing › Quantity is highlighted while typing`, `recipe-ingredient-editing › Enter moves to the next row`, `recipe-ingredient-editing › Arrow keys move between rows`, `recipe-ingredient-editing › Row buttons are one tab stop`, `recipe-ingredient-editing › Alt and arrow move the row`, `recipe-ingredient-editing › Backspace removes an empty row`, `recipe-ingredient-editing › Edge rows cannot move out of the list` and `recipe-ingredient-editing › Move is announced`, and by hand in `pnpm dev` at 360px and desktop width, with long lines, 200% zoom and a phone keyboard.
- [ ] 3.2b Group each row's up, down and delete buttons into one roving-tabindex toolbar (arrow keys, Home/End, remembered button), add ArrowUp/ArrowDown row navigation and Alt+ArrowUp/Alt+ArrowDown moves in the field, keeping Tab untouched; verify by hand with the keyboard only (type a whole list with Enter and arrows, reorder with Alt+arrows, reach and use every button with Tab and the arrow keys) and with a screen reader if available.
- [ ] 3.3 Add pointer-event dragging on the grip (hidden under `hover: none`, `touch-action: none`, Escape and `pointercancel` restore); verify with `test.todo`s named `recipe-ingredient-editing › Row can be dragged` and `recipe-ingredient-editing › Grip hidden on touch screens` and by hand with a mouse and on a touch device (arrows only).

## 4. Wrap-up

- [ ] 4.1 Run `pnpm test:spec edit-recipe-ingredients` and verify every delta scenario has a test or a `test.todo`; run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; verify all pass, then add, reorder and remove ingredients on a new and an existing recipe in `pnpm dev`.
