## Why

Only notes (4000 characters), tags (100 characters) and photos (2 MB) have a size limit. Title, author, time, intro, ingredients, steps and the number of tags, ingredients and steps are unbounded, so one request, by mistake or by a compromised mailbox, can store megabytes in one recipe and slow every page that shows it.

## What Changes

- Every free-text field of a recipe gets a maximum length, and the lists get a maximum number of rows. The editor stops typing at the limit; the server refuses a longer value, stores nothing and shows the editor again with a message at the field or row that states the limit.
- Servings get an upper bound of 999.
- The number of tags, which was explicitly unlimited, becomes at most 50.
- The database enforces the column lengths and the servings bound with `CHECK`s, so no code path can store more of those. No stored recipe comes near a limit, so existing rows are copied over unchanged.

## Capabilities

### New Capabilities

- `recipe-limits`: the maximum length of each recipe field and the maximum size of each list, on the client, the server and the database.

### Modified Capabilities

- `recipe-form`: the requirement "A tag is at most 100 characters" no longer says the number of tags is unlimited.

## Impact

- `src/app/routes/edit-recipe/lib/recipeValidation.ts`: limits, checks and messages; `RecipeFormErrors` gets an error per step like the one per ingredient row.
- `EditRecipePageRoute.tsx` and `NewRecipePageRoute.tsx`: use the new checks the way they already use `tagError`.
- `RecipeEditor.tsx`, the ingredient and step lists and the tag input: `maxLength` on the inputs and the new error messages.
- New migration `src/db/migrations/0016_size_limits.sql`: rebuilds `recipes`, `ingredients`, `steps` and `step_ingredient_chips` with `CHECK`s (their dependent tables are copied aside and back, since dropping a table cascades). The row counts are checked in code only, with no triggers.
- Out of scope: the existing note and photo limits, a limit on the whole request body, and limits on the numeric columns other than servings (oven temperature, timer minutes and amounts come from the bounded step and ingredient text).
