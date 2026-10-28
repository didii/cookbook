## Context

`recipeValidation.ts` already validates the base fields (`validate`), one tag limit (`maxTagLength`, `tagError`) and per-row ingredient errors (`RecipeFormErrors.ingredients`, keyed by row index). `NewRecipePageRoute.tsx` and `EditRecipePageRoute.tsx` build `errors` from these and return 400 with the entered values. Steps are cleaned by `cleanStep` and have no error channel. Notes and photos already have limits (`maxNoteLength`, `maxPhotoBytes`) and stay as they are. The schema has a few `CHECK`s (positive servings and amounts) but no length limits.

## Goals / Non-Goals

**Goals:** bounded size for every recipe field and list; same checks on create and edit; the editor prevents the mistake where it can, the server never trusts it, and the database is the last line for column sizes.

**Non-Goals:** a cap on the whole request body, truncating stored data, database triggers, database limits on row counts, limits on numeric columns other than servings.

## Decisions

- **One place for the numbers in code.** Export the limits from `recipeValidation.ts` next to `maxTagLength` so the server checks and the inputs' `maxLength` read the same constant. The migration repeats the numbers in SQL; a test (task 5.1) inserts values at and over each limit so the two cannot drift unnoticed.
- **Refuse, never truncate on the server.** Silent truncation would store something the member did not see. The client stops typing at the limit, so a server refusal only happens for non-browser or stale input.
- **Messages state the limit, their wording is free.** A message at the field includes the maximum (like the existing tag message "... hoogstens 100 tekens ..."). Tests build the expected number from the exported constant and assert the message contains it and sits at the right field or row; no test or spec pins the sentence.
- **Length is `String.length` of the trimmed value**, the same as the tag check. Characters outside the BMP count as two; accepted, the limits are generous. In SQL `length()` counts characters, so a value that is at the limit in code is at most the limit in SQL.
- **List errors sit on the first row over the limit.** `RecipeFormErrors.ingredients` already keys messages by row; the count message uses the same map. Steps get an equal `steps: Record<number, string>` that `StepList` shows per row.
- **Chips and timer name are checked on the posted data**, because they come from the client's parsing but are posted data. Per-step errors share the steps map: the first applicable message wins per step.
- **Servings:** the regex stays; add `Number(...) <= 999`. One message states the range 1 to 999. Tests that assert the old text change to assert the message exists.
- **Database: `CHECK` constraints by rebuilding the tables; row counts stay in code.** SQLite cannot add a `CHECK` to an existing column, so `recipes`, `ingredients`, `steps` and `step_ingredient_chips` are recreated with `CHECK (length(col) <= N)` (and `servings BETWEEN 1 AND 999`). Dropping a table that others reference with `ON DELETE CASCADE` deletes the children, and `defer_foreign_keys` does not stop cascades. So the migration first copies every table that depends on `recipes` into a temporary table (`ingredients`, `steps`, `step_ingredients`, `step_ingredient_chips`, `step_quantities`, `recipe_views`, `recipe_likes`, `recipe_notes`, `recipe_tags`), then drops and recreates `recipes` and the three child tables with their indexes, then copies everything back in parent-before-child order with the same ids, then drops the temporary tables. Production has 3 recipes, so the copy is small; `0015_quantity_ranges.sql` already rebuilds a table this way. A `CHECK` cannot count rows and the project does not want triggers, so the row limits (100 ingredients, steps and chips, 50 tags) are checked in code only. The migration test (task 4.2) checks that rows, ids and links survive. Existing rows are copied as they are; if one broke a limit the migration would fail loudly, and none does.
- **Why not rename the old table first.** `ALTER TABLE recipes RENAME TO recipes_old` makes SQLite rewrite the `REFERENCES recipes` of every child to `recipes_old`, so the children would follow the old table. That only works with `PRAGMA legacy_alter_table = ON`, which D1 may not allow. The copy-aside order is the default; if `legacy_alter_table` works in Miniflare and on D1, the rename variant (rename old, create new, copy, drop old) is shorter and may replace it.
- **Numbers other than servings:** left alone. Oven temperature, timer minutes and amounts are produced from bounded text, so their size is bounded indirectly; the app only needs `servings`, which is typed directly.

## Risks / Trade-offs

- A member who pasted a very long intro earlier can no longer save the recipe without shortening it; the limits are far above what a recipe needs.
- `RecipeFormErrors` growing a `steps` key touches the editor's error focus logic (first field in error); it must also handle a step error.
- The rebuild touches nine tables in one migration. A mistake (a missed column, index or child table) loses data. Mitigation: the migration test fills every table before applying `0016`, then compares all rows afterwards; take a D1 export (or note the time-travel bookmark) before running it in production.
