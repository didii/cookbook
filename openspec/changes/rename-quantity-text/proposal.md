# Proposal

## Why

`Ingredient.quantity_text` carries the database column name into the domain model, the UI and the posted form JSON, while the rest of the model is camelCase (`ovenTemperature`, `ParsedIngredient.quantityText`, `NewRecipe.quantityText`). The mix makes mapping code and tests inconsistent. Split from `rename-recipe-types` so that change stays a pure type rename.

## What Changes

- The `Ingredient` property `quantity_text` becomes `quantityText` everywhere in TypeScript: domain type, `getRecipe` mapping, step chips, `cleanStep` and the posted steps JSON, `chips.ts`, `StepChips` / `IngredientList` views, tests.
- The database column `quantity_text`, migrations and `seed/dev.sql` stay as they are (SQL columns are snake_case); only the row-to-domain mapping changes.
- No behaviour change for users.
- Depends on `rename-recipe-types` being merged first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Pure refactor; the change sets `skip_specs: true`.

## Impact

- `packages/web/app`: `lib/recipe.ts`, `.server/recipes.ts`, `lib/chips.ts`, `shared/recipeValidation.ts`, `routes/{recipe,edit-recipe}/*` and their tests.
- Posted steps JSON key changes from `quantity_text` to `quantityText`; client and server ship together.
- No migration, no seed change, no new dependency.
