# Proposal

## Why

A recipe is written for a fixed number of servings. Family members cook for more or fewer people and now have to do the sums themselves, for every ingredient and for every amount mentioned in the steps.

## What Changes

- The recipe page gets a servings control: big − and + buttons (easy to hit on a phone) and a field to type a number.
- All quantities scale with it: the ingredient list, the ingredient chips of the steps, and the amounts written in the step text. Times and oven temperatures never scale.
- A recipe without servings gets a relative multiplier instead, starting at ×1. The − and + buttons walk through 1/10, 1/8, 1/6, 1/4, 1/3, 1/2, 1, 1.5, 2, 3, 4, 5, 6, …
- Scaled numbers are shown with at most 3 significant digits, never dropping digits before the decimal comma (133.333 → 133, 13.333 → 13,3, 1234 → 1234), so no endless 0,3333333.
- The chosen amount is not stored: a reload starts at the recipe's own servings again.
- Out of scope (next proposal): units do not convert ("1000 g" stays "1000 g", not "1 kg"); names do not pluralise ("2 ei" stays "2 ei").

## Capabilities

### New Capabilities
- `recipe-scaling`: scaling a recipe's quantities on the recipe page by servings or by a multiplier, and how scaled numbers are shown.

### Modified Capabilities

## Impact

- `packages/web/app/lib`: new pure module that scales and formats a quantity and the amounts in a step text; `ingredients.ts` exports its number parser.
- `packages/web/app/routes/recipe`: `RecipePage` holds the factor and passes scaled data to `IngredientList` and `StepList`/`StepItem`/`StepChips`; new servings control component; the "n personen" label is replaced by it.
- No schema, server or dependency change.
