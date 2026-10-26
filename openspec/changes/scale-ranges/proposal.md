# Proposal

## Why

A quantity written as a range ("2-3 el olie", "1 à 2 uien") has no single value, so it is stored without one and shown as written when the servings change. A recipe for 4 stays "2-3 el" at 8 servings. Ranges are common in recipes, so a scaled recipe is wrong exactly where it is vague.

## What Changes

- Recognise a range of two numbers in an ingredient quantity, a chip quantity and a step's text, written as `2-3`, `2 - 3`, `2–3`, `2—3`, `2 à 3`, `2 tot 3`, `2 tot en met 3`, `2 of 3`, `tussen 2 en 3`, `2 to 3` or `2 or 3`. Each side can be a whole number, decimal, fraction or glyph (`½-1`, `1 1/2 - 2`). A comma, a slash and a tilde are not range separators.
- A range is only recognised in the general form `<range> <unit> <ingredient>`: the unit (if any) comes once, after the second number. `2 el - 3 el` stays two single quantities, which both scale.
- Store a second, optional quantity value (the upper number as typed) next to the existing one for an ingredient, a chip and a step amount. A step amount also stores where the second number sits in the text.
- Scale both values by the same factor. The two numbers are not sorted: `3-2` scales to `6-4` at ×2.
- Show a scaled ingredient row or chip as `min-max unit` with a `-` separator. In a step's text only the two numbers are replaced, so the separator and words around them stay as written ("2 à 3 el" becomes "4 à 6 el").
- Existing recipes get no second value; their ranges are found again the next time the recipe is saved from the editor.

## Capabilities

### New Capabilities

### Modified Capabilities
- `recipe-storage`: an ingredient, a chip and a step amount store an optional second quantity value (and, for a step amount, the place of the second number); ranges are recognised on save in these three places.
- `recipe-scaling`: both numbers of a range scale by the factor, shown as `min-max unit` in rows and chips and with only the numbers replaced in step text.

## Impact

- DB: one migration adding `quantity_value_max` to `ingredients`, `step_ingredient_chips` and `step_quantities`, and `max_start_index` / `max_end_index` to `step_quantities`.
- Code: `src/app/shared/numbers.ts` (range pattern), `src/app/routes/edit-recipe/lib/{quantity,quantities}.ts` and `lib/shared/ingredients.ts` (parsing), `src/app/shared/recipe.ts` and `recipes.server.ts` (types, read, write), `src/app/routes/recipe/lib/scale/scale.ts` (scaling).
- Dev seed data (`src/db/seed/dev.sql`) can gain a range or two.
- No change to timers, durations or oven temperatures: a duration range ("20-25 minuten") keeps using its lower value.
- Kanban card #44.
