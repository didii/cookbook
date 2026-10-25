# Design

## Context

`parseIngredient(text, rules)` looks for a unit only after a leading number. `parseQuantity(text)` (chip quantity text) takes no rules; it gives a value only when the text starts with a number. Rules are one JSON value in `settings`; `getRules` merges the saved value over `defaultRules`, so a field an older value lacks already takes its default.

`parseIngredient` has four other callers than the ingredient form: `rowsOf` (chips.ts), `IngredientItem` (quantity highlight) and `writtenQuantity` (stepParsers.ts), which treats a phrase with a quantity and no name as the amount written before an ingredient name.

## Goals / Non-Goals

**Goals:**
- A loose unit at the start of a line parses as quantity of that unit with value 1, in the ingredient form and in chip quantity text.

**Non-Goals:**
- Step text amounts (`findQuantities`): no number in the text, so nothing could be scaled in place.
- Multi-word loose units or phrases such as "een scheutje" (the existing "een snufje" stays a name part).

## Decisions

**A separate `looseUnits` list, not a flag on `units`.** The admin asked for an independent list, and a word may be in one list and not the other ("el" a unit only, "scheutje" both). Alternative: derive "loose" from a subset of `units`; rejected because it ties the two lists together and needs a second UI anyway.

**Loose units overlap `units` freely and are exempt from the "word in two lists" check.** The defaults themselves repeat "snufje" and "scheutje". With a number, the normal unit path applies ("2 scheutje" needs `scheutje` in `units`); without a number, only `looseUnits` counts.

**`looseUnits` may be empty; `units` may not.** An empty loose list switches the feature off, which is a valid choice. Same letters-only check as units, since both match as one word.

**Fallback needs no new code.** `getRules` already spreads saved over defaults, so only `isWords` must not be required for `looseUnits` (empty allowed) and must be checked when present: a present but invalid `looseUnits` falls back to the defaults like any other bad field.

**In `parseIngredient`, no leading number: match the first word.** If it is in `looseUnits` (case-insensitive, whole word via the existing `word` regex), then `quantityText` is that word as typed, `quantityValue` 1, `quantityUnit` the lowercase word, and the rest is the name. Otherwise the line is all name, as before.

**`parseQuantity(text, rules)` gets the rules.** When the text has no leading number and is exactly one loose unit, it returns value 1 and that unit. Its caller `cleanStep` in `recipeValidation.ts` already has `rules` nearby via `readSteps`; pass them down. Alternative: let `parseIngredient` do both; rejected, the chip text holds no name and the function has a different contract.

## Risks / Trade-offs

- [`writtenQuantity` now sees "scheutje" before an ingredient name as a written amount, so a chip for "wijn" in "voeg een scheutje wijn toe" shows "scheutje wijn" and stores value 1] → Wanted: it is the same reading as the ingredient line. The word "een" before it stays outside the amount.
- [A loose unit that is also a real first word of a name, e.g. "klont" in "klontjes kaas"] → Whole-word match only, so "klontjes" is not "klontje"; the admin removes a word that misfires.
- [A line that is only a loose unit, "scheutje", is refused for lacking a name] → Same as "2" alone today.
