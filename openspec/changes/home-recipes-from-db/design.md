## Context

`recipe`, `new-recipe` and `edit-recipe` already read and write D1 through `.server/recipes.ts`. Only `routes/home/route.tsx` still imports the sample `recipes` array from `lib/recipes.ts`. That file also holds the `Step` and `Ingredient` types that many modules import. `seed/dev.sql` already holds the same sample recipes as SQL for local development.

## Goals / Non-Goals

**Goals:** home page reads from the database; sample TypeScript data and its `Recipe` type are gone; empty state.

**Non-Goals:** search, filters, sorting options, pagination. A handful of family recipes fit on one page.

## Decisions

- **`listRecipes(db)` in `.server/recipes.ts`.** One query on `recipes` only (no ingredients or steps): `slug, title, author, time, image, seal`, ordered `id DESC` (newest first). Returns `RecipeSummary[]`, `Pick<RecipeRow, ...>`. No `created_at` ordering: ids grow with inserts and the column is not needed.
- **Loader in `home/route.tsx`**, same shape as the recipe route: `context.get(envContext).DB`. `tileFor(i)` stays in the component, it only depends on list position.
- **`RecipeCard` takes `RecipeSummary`** instead of `Recipe`, and renders `van {author}` plus ` · {time}` only when time is set (today it would print "null").
- **Types stay, data goes.** `lib/recipes.ts` keeps `Ingredient` and `Step` and loses the header comment, the helpers `i`/`step`, the `recipes` array and the `Recipe` type. No imports change. Moving the types elsewhere is churn for no gain.
- **Sample data lives in `seed/dev.sql` only.** Images under `public/img/*.jpg` stay: the seed refers to them.

## Risks / Trade-offs

- A fresh local database is empty until the seed is run; the empty state covers that. Mention the seed command in the empty state? No: it is a dev note, already at the top of `seed/dev.sql`.
- Home no longer works without D1, including in tests: loader tests use `createTestDb` like the recipe route tests.
