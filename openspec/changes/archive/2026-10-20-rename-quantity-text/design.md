# Design

## Context

`quantity_text` appears in the `Ingredient` type, in `getRecipe` and `insertSteps` (`.server/recipes.ts`), in `chips.ts` (`toStored`), in `cleanStep` (`recipeValidation.ts`) and in the recipe views. The SQL column of the same name is read and written only in `.server/recipes.ts`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:** one casing in TypeScript; the database layer is the only place that knows the column name.

**Non-Goals:** renaming the column (needs a migration, no gain); any other field.

## Decisions

- **Rename the property, not the column.** `SELECT ... quantity_text AS quantityText` in the queries, and `IngredientRow` / chip rows keep their snake_case shape only if the mapping stays explicit. Preferred: alias in SQL so rows already arrive as `quantityText` and `getRecipe` needs no extra mapping. Alternative (map in JS) rejected: more code for the same result.
- **Posted JSON key changes with it.** `cleanStep` reads `quantityText`. Rejected: accepting both keys; the form and server deploy together and a stale open tab only loses a chip quantity until reload.
- **Stored drafts.** The editor's `RecipeDraft` holds chip `values.quantity`, not `quantity_text`, so the persisted shape should not change and no `version` bump is needed. Verify in the first task; bump `version` in `lib/draftStore.ts` only if the check shows the old key in a stored draft.

## Risks / Trade-offs

- A missed `quantity_text` in a raw SQL string compiles fine and fails at runtime → `grep` for the old name in `app/` and rely on the existing route and query tests that read ingredients back.
- Stale browser tab posts the old key → accepted, see above.
