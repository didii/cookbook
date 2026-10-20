# Design

## Context

After `home-recipes-from-db`, `lib/recipes.ts` holds `Ingredient` and `Step`, and `.server/recipes.ts` holds `RecipeRow`, `IngredientRow`, `RecipeSummary`, `StoredRecipe`, `NewRecipe`, `RecipeUpdate`, `NewStep` plus a private `StepRow`. The form types sit in `shared/recipeValidation.ts`, the editor types in `lib/draft.ts`, the persisted wrapper `StoredDraft` in `lib/draftStore.ts`. See proposal.md for motivation.

```
rows (.server)   domain (lib/recipe.ts)   input        form             editor
RecipeRow   -->  Recipe, RecipeSummary    RecipeInput  RecipeForm  -->  RecipeDraft
IngredientRow    Ingredient, Step                      (+ lines/steps)  IngredientLine
StepRow                                                                 StepDraft
                                                       DraftSeed (loader -> editor)
```

## Goals / Non-Goals

**Goals:** each recipe-shaped type has one name, one home and one layer; the domain model is readable in a single file.

**Non-Goals:** renaming `quantity_text`, changing any runtime value, field or stored-draft shape; touching chip, parser, cook-mode, timer, tab or photo types.

## Decisions

- **Name by role, not suffix.** `Recipe`, `RecipeSummary`, `RecipeInput`, `RecipeForm`, `RecipeDraft`; `*Row` only for the database. `RecipeDto` was rejected: `getRecipe` returns the domain model, not a wire contract. `RecipeDb` was rejected: `RecipeRow` already says it, and is accurate (flat, snake_case).
- **`lib/recipe.ts`, singular, via `git mv`.** It runs on server and browser, so it belongs in `lib/`. `Recipe` is `RecipeRow` fields (minus nothing) plus `ingredients` and `steps`, declared in full, not derived from `.server`, so browser code never imports server types. `RecipeRow` stays in `.server` and a test-level type check (`satisfies`-style assignment in the query) keeps both in step.
- **`RecipeSummary` is its own model**, added by `home-recipes-from-db` for the home list (`slug, title, author, time, image, seal`, no ingredients or steps, no `id`). It moves from `.server/recipes.ts` (where it is a `Pick<RecipeRow, ...>`) to `lib/recipe.ts` because `RecipeCard` is browser code, and is declared in full there, not derived from `Recipe`: the list and the detail page may evolve apart (e.g. a cover thumbnail, a recipe count). `listRecipes` stays in `.server` and returns it.
- **`NewStep` is dropped in favour of `Partial` on `Step`**, only if the move leaves it unused elsewhere; otherwise it stays as `StepInput`. Decide at the compiler's say-so, no behaviour hangs on it.
- **Editor names.** `IngredientLine` (id + text; "line" is what the user types and what the form posts as `{ text }`), `StepDraft` (`StepChips` + id), `DraftSeed` (what loaders hand the editor, was `Content`; `emptyContent` becomes `emptyDraftSeed`). `StoredDraft` keeps its name: it is the persisted wrapper, and its JSON shape is unchanged, so no `version` bump.
- **`Values` in `chips.ts` becomes `ChipValues`**; the form `Values` becomes `RecipeForm`. This ends the clash.
- **Mechanical order:** rename with the editor's refactor tool or find-and-replace per type, one type group per task and commit, so each step compiles and tests pass on its own.

## Risks / Trade-offs

- Wide diff of import and name edits → one task group per rename family, compiler and existing tests as the check; no logic edits allowed in these commits.
- Branch conflicts with in-flight changes touching the same files → this change starts only after `home-recipes-from-db` is merged.
- `Recipe` duplicating `RecipeRow` fields could drift → the row-to-`Recipe` mapping in `getRecipe` is typed, so a mismatch fails the type check.
