# Design

## Context

See `proposal.md`. Visual and keyboard reference: `docs/design/parsing-rules.html`.

- `Rules` (`shared/rules.ts`) has `units`, `looseUnits`, `minuteWords`, `hourWords`, `degreeWords` and `spoken`. `rules.server.ts` stores it as JSON under the `parsing-rules` setting, validates a six-field text form, and `findTimer` (`stepParsers.ts`) reads the lists. `Rules` is also passed to the client by the recipe editor, which uses it to parse ingredients and steps.
- The ingredient list already has the row behaviour (`IngredientList`, `IngredientItem`, `useReorder`, `RowGrip`) in `edit-recipe`. It is controlled React state; the form posts one hidden JSON field (`ingredients`).
- The mockup's static behaviour (rows, free row, keys, suggestions) is only a reference; there is no logic to copy.

## Goals / Non-Goals

**Goals:**
- A rules page whose rows and keys match the ingredient list.
- A stored shape in which every duration is a word with minutes, and a "Vast" flag decides whether the number before it is used.
- Old saved rules keep working with no database migration.

**Non-Goals:**
- Sharing `IngredientItem` or the toolbar with the admin page; the admin rows are a different, smaller component.
- Server-side suggestions or a units table in the database: the suggestions come from the units on the page.
- Changing how ingredients, quantities or oven temperatures are parsed beyond the duration factor.

## Decisions

**Stored shape.** `Rules` becomes `{ units, looseUnits, perNumber: Record<string, number>, fixed: Record<string, number>, degreeWords }`. `perNumber` keys are words, values minutes per 1; `fixed` keys are phrases, values minutes. The Duur rows are these two maps in one list; "Vast" decides which map a row goes to. Alternative considered: keep `minuteWords`/`hourWords` and limit the minutes field to 1 or 60. Rejected: the field would be a picker, and `dag` = 1440 would not be possible.

**Reading old values.** `getRules` fills `perNumber` from `minuteWords` (1) and `hourWords` (60), and `fixed` from `spoken`, when the saved value has no `perNumber`/`fixed`. New keys win over old keys; a missing field still takes its default, as for loose units today. The value is only rewritten when the admin saves, and then in the new shape only. Nothing in the database changes, so there is no rollback step beyond reverting the code: an old reader would see the new shape as unreadable and fall back to the defaults. `defaultRules` keeps recognising exactly the same words (`minuteWords` → factor 1, `hourWords` → 60, `spoken` → `fixed`).

**Parser.** `findTimer` builds its alternation from `Object.keys(perNumber)` and multiplies the number by `perNumber[word]` (rounded, as now); the fixed phrase is still tried before a number plus word. `Rules` objects stay the cache key.

**Form transport.** The rows are React state in a form component; the form posts one hidden JSON field `rules` with the rows (`{ units: string[], looseUnits: string[], degreeWords: string[], durations: { word, minutes, fixed }[] }`, the free last row left out), the same pattern as `ingredients`. Alternative: repeated field names per row. Rejected: an unchecked checkbox is not posted, so the "Vast" values would shift out of line with the words. The server stays the authority: `readRules` takes this plain object, trims, lowercases, drops empty rows and repeats, and returns either the `Rules` or errors.

**Errors.** `RulesErrors` is per list: `{ list?: string; rows?: Record<number, string> }`, where a row index counts the rows as posted. On a refused save the action returns the posted rows with the errors; the page renders them back as they were sent, with the message under the faulty row and focus on the first one. A successful save or restore remounts the form from the stored rules (keyed on them), as the textareas do now.

**Checks.** As before, minus line syntax: units and loose units letters only; other words letters, `°` and spaces; units, duration words (both kinds) and degree words do not share a word, a loose unit may also be a unit. New: a word twice in the Duur rows is refused; a Duur row needs a word and 1 to 1440 minutes; units, degree words and at least one unchecked duration must exist (the old rule asked for minute words and hour words; one unchecked row is the least that still recognises "30 minuten"). A fixed phrase is not compared with units or degree words, as spoken durations were not.

**Components.** Moves to `app/shared/` because the admin page is the second route that needs them: `RowGrip`, `useReorder`, `dropIndex`, `useAfterRender`, `ItemHandle`, with their tests. `RowToolbar` stays in `edit-recipe`. New in `routes/admin-rules/lib/`: `RuleList` (a list of rows with the keyboard behaviour and `useReorder`; it holds no state of its own and reports changes through `onChange`), `RuleRow` (grip, field, optional extra cells, cross), and a `suggestions` prop on `RuleList` for the loose units. The bar with "Opslaan" and the restore link is a small component of this route; the editor's `SaveBar` is not shared because its content differs. Navigation keys follow `IngredientItem` (`Alt+↑/↓` keeps the caret, `Backspace` in an empty field removes the row and focuses the one above).

**Suggestions.** Base UI `Combobox` (already used by `TagInput`) in single-value mode with free text, items = the units on the page not yet in the loose units, filtered with `Combobox.useFilter({ sensitivity: 'base' })`. It owns `↑`/`↓`/`Enter`/`Esc` while the list is open; row navigation applies when it is closed. If it cannot keep a typed value that is not an item, a small listbox as in the mockup is used instead; the scenarios decide, not the library.

**Layout.** As the mockup: Eenheden two columns above 40rem, one below; Duur row wraps "Vast" to a second line below 40rem; the bar is fixed to the bottom (`position: fixed`), so the page gets bottom padding. Styling is Tailwind with the existing tokens; no new tokens.

## Risks / Trade-offs

[A saved value in the old shape is read forever] → The conversion is one small function with its own tests; the value is rewritten on the next save.

[The recipe editor reads `Rules` in the browser, and `Rules` changes shape] → Only `findTimer` reads the changed fields; a type check across `stepParsers`, `ingredients`, `quantity` and the editor finds the rest.

[Moving shared row files touches `edit-recipe` imports] → The move is its own task with tests unchanged, before any new code uses it.

[Drag by grip and row shifting depend on real layout] → Covered by the existing `useReorder` unit tests; drag on this page is a `test.todo`.

[JSON in a hidden field is invisible to a plain browser form] → The page already needs scripting for rows and the ingredient form works the same way; accepted.
