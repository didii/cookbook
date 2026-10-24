# Design

## Context

Change 3 of 3. Depends on `store-ingredient-quantities` and `store-chip-quantities` (both merged first); see proposal.md. After them the list and chips scale from stored values; step text is still scanned on the recipe page by `scaleBody`: the `beforeWord` regex (number followed by a word that is a rules unit) plus the quantity ranges that `findIngredients` returns (number written before an ingredient name). The save path is the editor action: `readIngredients` parses the lines against the rules, `readSteps` cleans each body (trim, line breaks → spaces). The steps are replaced as a whole on every save, including their chips.

## Goals / Non-Goals

**Goals:**
- Spans are found once, on the server, at save; the recipe page only replaces them.
- After this change nothing outside `routes/edit-recipe` parses ingredient or step text.

**Non-Goals:**
- Ranges (card #44), durations, temperatures, changing units, and tying spans to chips (a chip and a span can differ).

## Decisions

- **Table.** Migration `0012_step_quantities.sql`:
  `step_quantities (step_id INTEGER NOT NULL REFERENCES steps (id) ON DELETE CASCADE, start_index INTEGER NOT NULL, end_index INTEGER NOT NULL, quantity_value REAL NOT NULL CHECK (quantity_value > 0), quantity_unit TEXT, PRIMARY KEY (step_id, start_index), CHECK (end_index > start_index))`. Offsets are UTF-16 indexes into `steps.body` (what JavaScript `slice` uses), end exclusive, covering only the number. No `position`: reading with `ORDER BY start_index` is the order of the text. `start`/`end` are named `start_index`/`end_index` because `end` is an SQL keyword. `quantity_unit` is the unit that followed the number, null when the number was found by an ingredient name; it is stored for consistency with the other tables and is not used when scaling (the text keeps its unit).
- **Server finds the spans.** New `routes/edit-recipe/lib/quantities.ts`, `findQuantities(body, rows, rules)`, takes over the span logic of `scaleBody` (rules-unit regex plus `findIngredients`), keeps the "overlapping span is skipped" rule and drops ranges. `readSteps` gets the ingredient rows and rules; rows come from the posted ingredient lines (`readIngredients`), and from the stored ingredients when the form carries no list. Run on the body after `cleanStep`, so offsets match what is stored. The browser posts no spans. Alternative: trust spans posted by the editor; rejected, offsets can be off after the server's cleaning and a stale span would scale the wrong characters.
- **Read and scale.** `getRecipe` selects spans per step ordered by `start_index` into `Step.quantities` (`{ startIndex, endIndex, quantityValue, quantityUnit }[]`). `scale/scale.ts` gets `scaleText(body, quantities, factor)`: factor 1 → body; otherwise replace each span from the end with `formatNumber(value × factor)`. `formatNumber` and `parseNumber` stay; `scaleQuantity`, `scaleBody`, `leading`, `beforeWord` go.
- **Moves (STRUCTURE.md).** `parseIngredient`, `joinIngredient`, `ParsedIngredient` and `shared/stepParsers.ts` (with their tests) move to `routes/edit-recipe/lib/shared/` (`ingredients.ts`, `stepParsers.ts`): `lib/steps/`, `lib/ingredients/` and `lib/` all use them, so they cannot live in either sub-module. `shared/ingredients.ts` keeps only `numberPattern` and `numberValue` and is renamed `shared/numbers.ts`: the recipe route needs them for a typed multiplier, so they stay shared. Check with grep that `~app/shared/ingredients` and `~app/shared/stepParsers` no longer appear.
- **Seed.** `dev.sql` gets `step_quantities` rows. The offsets are generated once with `findQuantities` over the seeded step texts, not counted by hand; `seed/dev.test.ts` gets a check that each seeded span's text is a number equal to its value.

## Risks / Trade-offs

- Offsets and text can drift if a body is changed outside the editor. → Only the editor action writes steps, and it replaces text and spans together; `scaleText` skips a span whose characters are no number.
- Rows used for "number before an ingredient name" come from the lines posted in the same save. → An absent list falls back to the stored ingredients.
- Dropping range scaling in text is a visible regression for recipes with ranges. → Accepted for now, tracked as card #44.

## Migration Plan

Run the migration. Existing steps have no spans and show their text as written until saved again; there is no live data. Rollback: drop the table.
