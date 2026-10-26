# Proposal

## Why

The admin rules page ("Herkenning") is six free-text boxes: one word per line, and spoken durations as `phrase = minutes`. The syntax is loose and easy to get wrong, minute words, hour words and spoken durations are three lists for one idea (a word and a number of minutes), and the page does not feel like the ingredient list the admin already knows.

## What Changes

The approved mockup is `docs/design/parsing-rules.html` (described in `docs/design/README.md`); it is the visual and keyboard reference.

- The page has three categories on one page, saved together: **Eenheden** (units and loose units side by side), **Duur** and **Graden**.
- Every list is a list of rows, like the ingredient list but more compact: one field per row, an empty row always at the end, `Enter`/`↓`/`↑` between rows, `Alt+↑`/`Alt+↓` to move a row, `Backspace` in an empty field removes the row, a grip to drag, a cross right of the field. No up/down buttons.
- **Losse eenheden** suggests the units that are not yet loose units, live from the Eenheden list on the same page. Any other word may still be typed.
- **Duur** is one merged list. A row is a word, a number of minutes (1 to 1440) and a checkbox **Vast**. Unchecked, the word multiplies the number before it (`uur` = 60, `minuten` = 1, so "1,5 uur" is 90). Checked, the word stands alone (`een kwartier` = 15). Any factor works, so an admin can add `dag` = 1440.
- **BREAKING** (stored data): the stored rules replace `minuteWords`, `hourWords` and `spoken` with two maps, `perNumber` (word → minutes per 1) and `fixed` (phrase → minutes). Saved rules in the old shape are converted when read; nothing is migrated in the database.
- "Opslaan" moves to the right, in a bar fixed to the bottom of the screen; "Standaardwaarden herstellen" becomes a link-style button, still asking for confirmation.
- A mistake is shown on its row, not on a whole list. A word that appears twice in the Duur list is now refused.
- Out of scope: new kinds of rules, import/export, showing which recipes a rule affects, a per-row "used by" indication.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `parsing-rules`: the stored rules get the `perNumber` and `fixed` shape (and convert from the old one), the admin edits rows instead of lines, the new keyboard and suggestion behaviour, errors per row, the save bar and the link-style restore button.

## Impact

- `shared/rules.ts` (`Rules`, `defaultRules`) and `shared/rules.server.ts` (`getRules` with conversion, `readRules`, `saveRules`, `toFields`), plus their tests.
- `edit-recipe/lib/shared/stepParsers.ts` (`findTimer` multiplies by the stored factor) and its test; `ingredients.ts`/`quantity.ts` only if they read the renamed fields.
- `routes/admin-rules/AdminRulesPageRoute.tsx` and its test, rebuilt on new components in `routes/admin-rules/lib/`.
- `RowGrip`, `useReorder`, `dropIndex`, `useAfterRender` and `ItemHandle` move from `routes/edit-recipe/lib/shared/` to `app/shared/`, because a second route now needs them; imports in `edit-recipe` change.
- `openspec/specs/parsing-rules/spec.md` (delta only). No database migration, no new dependency.
