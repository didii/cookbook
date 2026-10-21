# Design

## Context

Stored ingredients and step chips are `{ quantityText, name }`: free text, no number. The step text is free text too. `parseIngredient` (`lib/ingredients.ts`) already reads a leading number (decimal, `1/2`, `1 2/3`, `½`, ranges) and a unit from the units list, and `findIngredients` (`lib/stepParsers.ts`) finds ingredient names in a step text together with the amount written right before them. `RecipePage` already keeps page-only state (ticked ingredients) and passes `ingredients` and `steps` down. Nothing about scaling needs the server.

## Goals / Non-Goals

**Goals:**
- One pure module doing the maths and the formatting, unit-tested.
- Scaling at render time only; stored data and the editor stay untouched.

**Non-Goals:**
- Unit conversion or pluralising names (next proposal).
- Storing the chosen amount, or putting it in the URL.
- Changing the servings field in the editor.

## Decisions

- **New `lib/scale.ts`** with `scaleQuantity(text, factor)`, `scaleBody(body, factor, rows)`, `formatNumber(n)` and `nextMultiplier(current, direction)`. Pure, so it is testable without a DOM and works in server render.
- **Quantity text**: replace the leading number(s) (both ends of a range) by the scaled, formatted value and keep the rest as written (unit, spaces, dash). Reuse the number pattern and value parser of `ingredients.ts` (export them) instead of writing a second parser. Factor 1 returns the text untouched, so `1 ½` never turns into `1,5` unless the user scales. Text without a leading number is returned as is.
- **Step text**: scan for numbers (same pattern) and scale one when the next word is an ingredient unit, or when it is the amount `findIngredients` reports as written before an ingredient name (rows = the recipe's ingredient rows, parsed once per page). Durations ("minuten", "uur") and temperatures ("graden", "°C") are not in the units list, so they are never touched. Alternative considered: scale every number in the text; rejected, it breaks "20 minuten" and "180 graden".
- **Formatting**: round to 3 significant digits, but integers of 4 or more digits are only rounded to a whole number (1234,5 → 1235; `toPrecision(3)` would give 1230). Dutch comma, no trailing zeros.
- **Factor**: with servings, `chosen / recipe.servings`; without, the multiplier itself. The chosen amount is `useState` in `RecipePage`, not stored; the page is already keyed by slug, so another recipe starts fresh and a reload resets.
- **Control**: new `routes/recipe/ScaleControl.tsx` replacing the "n personen" span: − button, `<input type="text" inputMode="decimal">`, + button, buttons `min-h-11 min-w-11`, label "personen" or "×". The input keeps its own draft text and commits on change/blur/Enter; an invalid draft reverts on blur. Servings accept whole numbers ≥ 1; the multiplier accepts a decimal or fraction > 0 (reusing the value parser) and is shown as a fraction for the ladder fractions ("1/3") and as a formatted number otherwise.
- **Ladder**: 1/10, 1/8, 1/6, 1/4, 1/3, 1/2, 1, 1.5, 2, 3, 4, then integers. Plus = first value strictly above current (beyond 4: `floor(current) + 1`); minus = last value strictly below (beyond 4: `ceil(current) - 1`, at least 4), floor at 1/10. Compare with a small epsilon so a typed 0,3333 behaves like 1/3.
- **Servings step by ±1.** The request gives the stepped sequence for the multiplier only; servings use the natural ±1. Recorded as an assumption.

## Risks / Trade-offs

- [An amount in a step text that has no unit and is not before a known ingredient ("voeg 2 toe") is not scaled] → acceptable; chips and list stay right, and adding the name to the list makes it scale.
- [Pluralisation: "1 ei" doubled reads "2 ei"] → out of scope, named in the proposal.
- [Rounding to 3 digits makes 1000 × 1/3 show as 333] → by request.
