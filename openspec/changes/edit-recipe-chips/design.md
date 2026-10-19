# Design

## Context

**Design reference:** the approved mockup is `docs/design/recipe-editor.html` (static, open it in a browser; see `docs/design/README.md`). It shows the layout, every chip state and the keyboard toolbars; the app's own tokens in `packages/web/app/app.css` win where the two differ.

The recipe view's `Step` is `{ body, ingredients: {quantity_text, name}[], ovenTemperature?, timer?: {minutes, label?} }` (`app/lib/recipes.ts`, "meant to become" the stored type) and is rendered from hardcoded sample recipes; the database holds only `steps.body`, and `step_ingredients` links a step to a row of the recipe's ingredient list with an optional amount and unit (no free text, so it cannot hold a chip like "1 scheutje citroensap"; the decision, confirmed with the user, is to store free-text chips and leave that table unused). Already built by earlier changes: the editor shell and `Draft`, the ingredient rows (`Draft.ingredients` with client ids, `parseIngredient`), the step list with `StepText` (a mirror layer taking `marks`, and `onEdit` reporting the replaced range of every edit, code-point safe) and the atomic replace of steps in `updateRecipe`. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- Chips cost the family member nothing in the common case: type the step, the chips are there.
- Full control when wanted: every chip can be pinned, edited, removed, restored, or made by hand.
- Anchor tracking whose correctness is demonstrated by tests, not by hope.
- What the editor saves is exactly what the recipe page shows.

**Non-Goals:**
- English words and units (the later import), several timers or ovens per step, ingredient picker UI in the popup, scaling amounts, dropping `step_ingredients`.

## Decisions

### Data model in the editor

```
Chip    = { id, kind: 'ingredient' | 'oven' | 'timer', mode: 'auto' | 'manual',
            anchor?: { start, end },   // UTF-16 range in the step body
            rowId?: string,            // linked ingredient row (ingredient chips)
            values: Values,            // pinned values; ignored while mode = 'auto'
            label?: string,            // timer name, never part of the comparison
            lost?: true,               // pinned chip whose words were deleted: proposes its removal
            ignored?: Values }         // proposal the user discarded, or what the words said when the user edited the value
Ghost   = { id, kind, anchor, rowId? } // an anchored chip that was removed
Step    = { id, body, chips: Chip[], ghosts: Ghost[] }
Values  = { quantity?: string; name: string }  |  { degrees: number }  |  { minutes: number }
```

A following chip's shown values are *derived* on every render (`derive(chip, body, rows, steps)`) from its anchor text and the list; they are not stored in state, which is what makes "follows the text" true by construction. A pinned chip shows `values`. Everything below is pure code in `lib/` (`anchors.ts`, `stepParsers.ts`, `chips.ts`), unit-tested without a browser.

### Recognition (`lib/stepParsers.ts`)

Each finder takes the body (and for ingredients the rows) and returns matches `{ kind, start, end, values, rowId? }`:
- **Timer.** A number (digits with `,`/`.` decimals) optionally as a range (`20-25`, lower value used) followed by `min`, `minuut`, `minuten` (minutes) or `uur`, `u` as a whole word (hours, times 60, rounded); plus the fixed phrases `een half uur` (30), `een kwartier` (15), `anderhalf uur` (90), `een uur` (60). Only whole-word matches, so `30 gram` or `30 m` are not timers, and a partially typed `30 mi` is not yet one (the chip appears when the word completes, which is also why a half-typed duration never flickers a wrong chip). The first match is the timer.
- **Oven.** A number 50-300 followed by `graden`, `°C`, `°` or `gr`; the first match is the oven chip.
- **Ingredient.** For each row, its head word is the last word of its name; `stem(word)` lowercases, removes diacritics and strips a plural: `-eren` → ``, `-en` → `` (undoubling a final doubled consonant: `bessen` → `bes`), `-s`/`'s` → ``. A step word matches a row when the stems are equal. When the text contains the row's whole name as consecutive words the match covers all of them; otherwise it covers the head word. Longest match wins when rows overlap; ties go to the earlier row; one chip per row per step, at the first mention. If the digits-and-unit phrase right before the match parses as a quantity (`parseIngredient` quantity grammar, e.g. `100 g`), the match extends to include it and `values.quantity` is that text. Otherwise `values.quantity` is the row's quantity when no other step mentions this row (a per-step mention set is kept up to date when a step's text changes), else empty.

### Anchor tracking (`lib/anchors.ts`)

`mapRange(range, edit) → Range | undefined`, where `edit = { start: a, removed: r, inserted: i }` is what `StepText` reports. With a range `[s, e)`:
1. Edit entirely before (`a + r <= s`, including a pure insertion at `a = s`): shift by `i − r`. Typed text at the start edge stays outside.
2. Edit entirely after (`a >= e`, including a pure insertion at `a = e`): unchanged. Typed text at the end edge stays outside.
3. Edit inside (`s <= a` and `a + r <= e`, not a pure edge insertion): `e' = e + i − r`.
4. Edit covers the whole range (`a <= s` and `a + r >= e`, `r > 0`): if `i > 0` the range becomes `[a, a + i)` (the anchor moves to the new words); if `i = 0` the range is lost (`undefined`).
5. Edit straddles one edge: the remainder survives and the inserted text stays outside it (`[a + i, e')` or `[s, a)`).
Because the inputs are *indexes plus lengths* and `textEdit` already snaps to code points, emoji and other two-unit characters need no special case here: typing one before an anchor is `inserted = 2`, which shifts it by two. A range that collapses to empty is lost.

*Why not positions, and not anchoring to the name only?* A character offset is wrong the moment text is inserted before it; the replaced range of each edit is the one fact that tells us how everything after it moved, and it is what `StepText` already reports exactly. The anchor is the whole phrase that justifies the chip (`100 g boter`, `30 minuten`), so a quantity that is editable in the text is inside the anchor. For an ingredient whose amount comes from the list, the anchor is just the name words, and the amount lives in the linked row, the single source of truth.

*Testing approach (the part the user asked about):* table tests for each rule above, including emoji (`'😀'` is two units), ZWJ sequences, edits at both edges, straddling and covering edits, cut-and-paste elsewhere (a loss then a new match), plus a seeded property test: put a sentinel phrase in random text, apply a few hundred random insertions, deletions and replacements that never overlap the phrase's current range, and assert after each that `body.slice(range) === phrase`. Edits that do overlap are covered by the table tests. The real-browser path (`beforeinput` hints, IME, undo) is covered by the `computeEdit` tests of `edit-recipe-steps`; here we trust its contract.

### Reconciling after every edit (`lib/chips.ts: reconcile`)

On a text edit of a step, and on a change of the ingredient list for all steps:
1. Map every chip and ghost anchor through the edit.
2. Re-run the finders on the new body.
3. **Following chips:** take the finder's first match of the same kind (and row) in the new body and move the anchor to it; with no match the chip is removed. The mapped anchor is not consulted: a following chip's slot is the finder's one match per kind (one per row), so the finder, not the mapping, has the last word. This is what lets `30 min` extend to `30 minuten` while it is typed, and it means that when the words of a timer are deleted but a later duration exists, the chip moves to that later duration instead of disappearing.
4. **Pinned chips:** keep the mapped anchor; never re-anchored. An anchor that the edit took away (`mapRange` gives undefined) sets `lost`, which is a proposed removal until answered (and cannot be switched back to following). Its proposal is derived on render: parse the anchor text with the same finder for its kind; no match or no anchor → proposed removal; a match whose values differ from `values` and from `ignored` → proposed change. Accepting a change copies the derived values into `values`; discarding stores them in `ignored` (so the same proposal does not come back until the words change again). Accepting a removal deletes the chip (no ghost); discarding clears the anchor (and `lost`) and leaves the chip pinned. Editing a value in the popup stores what the words say at that moment as `ignored`, so the edit is not answered with a proposal of the old words. A change of the ingredient list (and only that) unlinks pinned chips whose row is gone or no longer matches their words: they keep their values, lose `rowId` and anchor, and so propose nothing; every other reconcile leaves an open removal proposal alone.
5. **Ghosts:** keep the mapped anchor; dropped when lost or when the words no longer match.
6. **New matches:** a match with no chip, no ghost and no pinned chip occupying its slot becomes a new following chip. Oven and timer slots are one per step, so a pinned or ghost chip of that kind blocks creation; an ingredient slot is blocked by any chip or ghost of the same row in the step.
Following chips and ghosts of a row that no longer exists, or no longer matches the words, are removed; pinned chips keep their values and drop `rowId`.

### Pinning, switching, removing

- Link/pin icon or the popup toggle: auto → manual copies the derived values into `values` (frozen); manual → auto requires an anchor, sets `mode: 'auto'` and the next derive replaces the values. Editing a value in the popup writes it to `values` and sets `mode: 'manual'`. The timer `label` is edited without changing the mode.
- Removing an anchored chip moves it to `ghosts`; restoring puts it back as a following chip with that anchor. Removing an unanchored chip just deletes it. The add row offers `+ Oven`/`+ Timer` only when the step has no chip or ghost of that kind.
- Hand-made chips: `mode: 'manual'`, no anchor, `values` from the popup, which opens immediately with the first field focused.

### UI

- `StepChips` renders, under the step text, a `ul` of chips and a full-width add row (`flex-basis: 100%`, `opacity: 0` until the step is hovered or focused, never `display: none`, so heights do not change). Ghosts live in the add row, struck through, with a dashed border and the kind's icon.
- A chip is the mode button (link/pin icon, a mouse and touch shortcut, `tabindex="-1"`) plus the chip button (opens the popup). The icon is not a Tab stop because the popup's "Volgt tekst / Vast" control does the same for keyboard and screen reader users, so no function is lost. The step's chips (and add row buttons) form one `role="toolbar"` (no extra visual treatment: the chips already read as a group) with a roving tabindex: one Tab stop, left and right arrow keys between chips, `Enter`/`Space` opens the popup, `Delete` removes the focused chip. Hovering or keyboard-focusing a chip sets the step's `hotChipId`, which `StepText` turns into a filled mark; the caret entering an anchor (selection change) also highlights its chip. Hovering the text itself cannot highlight the chip (the textarea owns the pointer), a known limitation.
- `ChipPopup` is a non-modal `role="dialog"` positioned under the chip inside the step (full width of the step on narrow screens), without a focus trap, closing on Escape and on an outside click, returning focus to the chip. Fields per kind: minutes and name; degrees; quantity and name. A segmented "Volgt tekst / Vast" control with a short Dutch explanation of each. The proposal buttons are a small joined button group inside the chip (✓ accept / ✕ discard); removal proposals are red and struck through with a trash icon on the accept button, and carry no explanatory text (the popup explains).
- The save bar's status slot gets "N voorstellen open" (count of proposals across steps) as a button that focuses the next proposed chip in document order, cycling.
- `IngredientList`'s `usedIn(rowId)` returns the step numbers of the chips linked to that row (following or pinned).

### Storage

- **Migration `0003_step_chips.sql`:** `ALTER TABLE steps ADD COLUMN oven_temperature INTEGER CHECK (oven_temperature > 0)`, `timer_minutes INTEGER CHECK (timer_minutes > 0)`, `timer_label TEXT` with a column check on `timer_label` that it needs minutes (a check on a new column may refer to the other new column, so `steps` is not recreated and its rows, foreign keys and `UNIQUE (id, recipe_id)` stay as they are), and `CREATE TABLE step_ingredient_chips (step_id INTEGER NOT NULL REFERENCES steps (id) ON DELETE CASCADE, position INTEGER NOT NULL, quantity_text TEXT NOT NULL DEFAULT '', name TEXT NOT NULL CHECK (name <> ''), PRIMARY KEY (step_id, position))`. `step_ingredients` stays, unused.
- `getRecipe` returns `steps: Step[]` in the shape of `lib/recipes.ts` (chips included) in one batch (steps, then chips joined by step), and `createRecipe`/`updateRecipe` write the new columns and chip rows inside the same atomic batches as the step replace. The recipe route loads `getRecipe` and maps it to `Recipe`, and the sample `recipes` array is no longer used by the page (the home page still lists it, card #4). `seed/dev.sql` gains the sample recipes with their chips so `pnpm dev` stays useful.
- **Saving:** `toStored(step)` writes following chips with their derived values and pinned chips with `values` (never `ignored` or a proposal), at most one oven and one timer, ingredient chips in on-screen order. The form posts the steps' chips inside the existing `steps` JSON (`{ body, chips }`); the server validates kinds and values (degrees and minutes are positive whole numbers; the 50-300 plausibility range only drives recognition from text, since a family member may type 40 for a warm oven by hand).
- **Opening an edit** (`classifyStored`): for each stored oven/timer chip, run the finder on the body; equal values → following, anchored to the match; a different value with a match → pinned and anchored there (the difference shows as an immediate proposal); no match → pinned, unanchored. For a stored ingredient chip, find the row whose name equals the chip's name (case-insensitive) or, failing that, whose head word stems equal the chip's last word; then find that row's mention; derived values equal to the stored pair → following; otherwise pinned (anchored when a mention exists, linked when a row exists). The timer `label` is excluded from the comparison and always kept. Words that say something (a duration, a temperature, an ingredient row's mention) that no stored chip accounts for get a ghost, so that opening a recipe never invents chips the family member (or an earlier recipe without chips) did not have; they can be brought back from the add row.

## Risks / Trade-offs

- Heuristics will sometimes be wrong (a word that looks like an ingredient, an unlisted plural) → every chip can be removed, and a removed chip leaves a ghost so the text does not recreate it; the finders are small, tested and easy to extend.
- A following ingredient chip's amount depends on how many steps mention it, so adding a mention in a second step removes the amount from the first step's following chip → intentional (a full amount in both steps would be wrong); pin the chip to keep an amount.
- A pinned chip whose words are cut and pasted elsewhere shows a proposed removal while a new following chip appears for the pasted words → the user accepts the removal; the pinned chip held the slot, so no duplicate appears until then.
- Hover from text to chip is not possible with a textarea on top → caret and chip-hover highlighting cover the need.

## Migration Plan

Apply `0003_step_chips.sql` locally (`pnpm db:migrate:local`), run the migration test, then remote (`pnpm db:migrate:remote`) before deploying the app, since the new `getRecipe` selects the new columns. There is no live data yet; the dev seed supplies recipes with chips. Rollback: the old code ignores the new columns and table.
