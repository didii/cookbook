# Proposal

## Why

"scheutje rode wijn" is not split into unit "scheutje" and ingredient "rode wijn": a unit is only looked for after a leading number, so the whole line becomes the name. Some units are normally written without a number ("scheutje", "snufje", "handvol") and mean one of them. Measures such as "g" or "el" must keep needing a number.

## What Changes

- New rule kind `looseUnits`: words that count as a unit when a line starts with them and no number, with quantity value 1. A separate list, not a subset of `units`; the admin decides what is in it.
- Default list: snuf, snufje, scheut, scheutje, mespunt, mespuntje, handvol, klont, klontje.
- An ingredient line or chip quantity that starts with a loose unit gets quantity value 1 and that unit ("scheutje rode wijn" gives "scheutje", 1, "scheutje", name "rode wijn"). The quantity text stays as typed.
- The admin rules page gets a list "Losse eenheden", edited and validated like the units (letters only, not empty, a word in one list only).
- Saved rules without the new field use the default list.
- Not changed: amounts found in step text (a bare "scheutje" in a sentence is not an amount to scale), and units after a number.

## Capabilities

### New Capabilities

### Modified Capabilities
- `parsing-rules`: a sixth kind of rule (loose units) with defaults, admin editing and validation, and used when splitting an ingredient line.
- `recipe-ingredient-editing`: a line that starts with a loose unit and no number gets quantity value 1 and that unit.
- `recipe-storage`: a chip whose quantity text is only a loose unit is stored with value 1 and that unit.

## Impact

- `src/app/shared/rules.ts`, `rules.server.ts`: new field, defaults, fallback, validation, form fields.
- `src/app/routes/admin-rules/AdminRulesPageRoute.tsx`: new field on the page.
- `src/app/routes/edit-recipe/lib/shared/ingredients.ts` (`parseIngredient`), `lib/quantity.ts` (`parseQuantity`, now needs the rules) and its caller `lib/recipeValidation.ts`.
- No database migration: rules are one JSON value in `settings`.
