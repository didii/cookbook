# Design

## Context

A range is parsed today but thrown away: `parseIngredient` gives it no value, `parseQuantity` returns `{}`, and `findQuantities` collects range spans only to exclude single numbers inside them. So a range reaches the recipe page without a value and `scaleIngredient` / `scaleText` leave it alone. See proposal.md for why. The pieces to touch are the number pattern (`shared/numbers.ts`), the three parsers, the three stored shapes (`RecipeIngredient`, `StepIngredient`, `StepQuantity`), their D1 columns and the two scale functions. Step text is the only place that is a sentence; rows and chips are generated from value + unit.

## Goals / Non-Goals

**Goals:**
- One range grammar, defined once and used by all three parsers.
- Scaling a range keeps the step text readable by replacing numbers in place.

**Non-Goals:**
- Duration ranges ("20-25 minuten") and oven temperatures: unchanged.
- Rewriting stored recipes: old rows keep no maximum until the recipe is saved again from the editor.
- Sorting, swapping or refusing a reversed range.

## Decisions

**Range grammar lives in `shared/numbers.ts`.** Export `rangePattern` next to `numberPattern`: two numbers joined by one of `-`, `–`, `—`, `à`, `tot en met`, `tot`, `of`, `to`, `or` (longest first), with optional spaces around a dash and mandatory whitespace around a word. The three parsers today each build their own `[-–]` regex; they all switch to this one. Alternative: a per-parser separator list — rejected, the three would drift.

**`tussen X en Y` is a prefix form.** In a row or chip quantity text the quantity is everything before the unit, so `tussen 2 en 3` is accepted there as one pattern alternative (and `tussen` stays part of the quantity text). In step text only the two numbers are spans, so `tussen` and `en` are ordinary words that stay as written. The pattern `en` is only a separator after a `tussen` prefix, never alone ("2 en 3 eieren" is not a range).

**Second value is a nullable column, not a second row.** `quantity_value_max REAL CHECK (quantity_value_max > 0)` on `ingredients`, `step_ingredient_chips` and `step_quantities`, with a `CHECK (quantity_value_max IS NULL OR quantity_value IS NOT NULL)` where the value column is nullable. Alternative: store a range as two single-value rows — rejected, rows and chips are one display line and would need re-joining.

**A step amount stores the second number's place.** `step_quantities` gets `max_start_index` and `max_end_index` next to `quantity_value_max`, all three NULL or all three set, with `max_start_index >= end_index` and `max_end_index > max_start_index`. The primary key stays `(step_id, start_index)`. Alternative: one span covering the whole range text plus re-parsing at scale time — rejected, scaling should not re-parse text (the existing rule: it only checks the characters are still a number).

**Scaling a step range replaces two spans.** `scaleText` expands each range amount into two replacements (first number, second number) and applies the existing from-the-end loop and overlap/“still a number” guards to both. If either span no longer holds a number, the whole amount is left alone, so a half-edited range never turns into one scaled and one not. The separator and unit in between are never touched, so `2 à 3 el` becomes `4 à 6 el` and a unit on both sides (two single amounts) behaves as today.

**Rows and chips are rebuilt as `min-max unit`.** `scaleIngredient` formats both values with `formatNumber` and joins them with `-`, then the unit. "Min-max" means value then maximum as stored, not sorted, so `3-2` gives `6-4`. These strings are short labels, so normalising the separator never produces an odd sentence. At factor 1 the stored text is still shown unchanged.

**`quantity_value_max` only exists with `quantity_value`.** A range that fails to parse as two numbers is stored without either, as today.

## Risks / Trade-offs

- [`of` also joins alternatives, "2 el boter of 3 el olie"] → a range needs the number right before and right after `of` with the unit only after the second number, so this does not match. "1 of 2 uien" does match, which is the intent.
- [`or`/`to` are English words in a Dutch app] → they need a number on each side; an ingredient called "2 or" is not realistic.
- [Existing recipes have no maximum] → their ranges keep showing as written until saved again. No backfill: the old quantity text is kept, and re-saving goes through the same parser.
- [`2 el - 3 el` is not a range] → in step text it is two single amounts and both scale. In a row it is the quantity `2 el` with the rest as name; unchanged from today.

## Migration Plan

One migration (`0015_quantity_ranges.sql`). `ingredients` and `step_ingredient_chips` get `ALTER TABLE … ADD COLUMN quantity_value_max`. `step_quantities` is rebuilt (create new, copy rows, drop, rename) because SQLite cannot add the table-level all-or-none check with `ADD COLUMN`. No data changes; rollback is not using the columns. `src/db/migrations/migrations.test.ts` and `src/testing/db.ts` pick it up.
