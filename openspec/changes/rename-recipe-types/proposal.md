# Proposal

## Why

Recipe-shaped types have grown by accident. `IngredientRow` is a database row in `.server/recipes.ts` and an editor line in `lib/draft.ts`; `StepRow` likewise; `Values` is the form strings in `recipeValidation.ts` and the chip values in `chips.ts`. The page's recipe type is called `StoredRecipe` and lives in `.server/`, while `lib/recipes.ts` holds only `Step` and `Ingredient`. A reader cannot tell from a name which layer (database, domain, form, editor) a function takes. `home-recipes-from-db` removes the last sample `Recipe` type, so the name and the place are free now.

## What Changes

- One file, `lib/recipe.ts` (renamed from `lib/recipes.ts`), declares the domain model: `Recipe` (was `StoredRecipe`), `Step`, `Ingredient`, `RecipeSummary`.
- `.server/recipes.ts` keeps only the database rows (`RecipeRow`, `IngredientRow`, `StepRow`) and the queries; it maps rows to the domain model.
- `NewRecipe` / `RecipeUpdate` become `RecipeInput` (the update is a `Pick` of it).
- Form: `Values` / `Field` / `Errors` become `RecipeForm` / `RecipeFormField` / `RecipeFormErrors`.
- Editor: `Draft` / `IngredientRow` / `StepRow` / `Content` become `RecipeDraft` / `IngredientLine` / `StepDraft` / `DraftSeed`.
- Chips: `Values` becomes `ChipValues`.
- No behaviour change. `quantity_text` keeps its name (a follow-up change). No `Dto` / `Db` suffixes. Chip, parser, cook-mode, timer, tab and photo types stay as they are.
- Depends on `home-recipes-from-db` being merged first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Pure refactor; the change sets `skip_specs: true`.

## Impact

- `packages/web/app`: `lib/recipes.ts` (renamed), `lib/draft.ts`, `lib/draftStore.ts`, `lib/chips.ts`, `.server/recipes.ts`, `shared/recipeValidation.ts`, `shared/recipeEditor/*`, `routes/{home,recipe,new-recipe,edit-recipe}/*` and their tests (imports and type names only).
- No database, API, dependency or stored-draft change.
