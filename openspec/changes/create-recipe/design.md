# Design

## Context

Recipes live in D1 (`recipes`, `ingredients`, `steps`, see recipe-storage). Server code is in `app/.server/` and routes under `app/routes/<name>/`. The header already shows the user's email on every page, and `userEmailContext` gives the creator's email in loaders and actions.

## Goals / Non-Goals

**Goals:**
- Create a recipe from title, author and servings.
- A create function that can store all properties, so later cards do not change it.

**Non-Goals:**
- Fields for time, intro, image, seal, ingredients, steps; editing; deleting; listing new recipes on home.

## Decisions

- **Entry point: a text link in the existing header**, not a floating button or a new menu bar. A floating button sits over the content people mostly scroll; a menu bar is a design with no content yet beyond this one link. The header is already on every page, so one link is the smallest thing that works. If more destinations appear (e.g. "About"), the header link can grow into a menu then.
- **Mobile header space**: the brand is ~200px wide and the row is ~328px on a 360px phone, so the email already truncates and cannot share the row with a link. Below `sm` the email is hidden (it only says who is signed in) and the link reads "+ Nieuw" with a touch target of at least 44px; from `sm` up the email shows and the link reads "Nieuw recept". Verify at 360px that nothing wraps or overflows.
- **Route `/recepten/nieuw`** with a form and an `action`, declared before `recepten/:slug` in `routes.ts`. Plain `<Form method="post">` so it works without JavaScript; the action validates, creates, and `redirect`s to the new page. On invalid input it returns `data({errors, values}, {status: 400})`.
- **`createRecipe(db, input)` in `.server/recipes.ts`** takes the full recipe (required fields plus optional time, intro, image, seal, creator, ingredients, steps) and writes everything in one `db.batch`. The route passes only title, author, servings and creator. Ingredients and steps are inserted with positions in the same batch, using the new recipe's id via subselect on slug (as the existing tests do).
- **Author autocomplete**: a free-text field with suggestions. The route loader returns the distinct authors (`GROUP BY author COLLATE NOCASE`, so case variants show once); the form is an `Autocomplete` from `@base-ui/react`. Other options considered: the `shadcn` Combobox is select-only (it restores the input to the picked item), HeroUI needs `allowsCustomValue` and brings its own theme and provider, and a native `<datalist>` is the least code but cannot be styled and behaves poorly on phones. Base UI is the headless layer shadcn's current components are built on; used directly it gives the same behavior and accessibility, styled with our own Tailwind tokens in one colocated component (`AuthorInput.tsx`), without the shadcn CLI's `components.json`, CSS variables and `cn` helper that would duplicate ours. Its `Autocomplete` (not `Combobox`) keeps typed text as the value and submits it under the field `name`, so the action needs no change. Filtering uses `Autocomplete.useFilter({ sensitivity: 'base' })`, which ignores case and accents.
- **Author spelling**: `createRecipe` inserts the author as `COALESCE((SELECT author FROM recipes WHERE author = ? COLLATE NOCASE LIMIT 1), ?)`, so a case variant of a stored author gets the stored spelling in the same statement, regardless of what the browser sent. SQLite's `NOCASE` only folds ASCII letters, so "émile" and "Émile" stay separate authors; acceptable.
- **Slug**: lowercase, diacritics stripped (`normalize('NFD')`), runs of non-alphanumerics become `-`, trimmed; empty falls back to `recept`. A pure helper in `.server/recipes.ts`, unit-tested. `nieuw` is reserved, and a taken slug gets `-2`, `-3`, … picked by checking existing slugs that start with the base in one query.
- **Validation** is in the action (trim title/author, servings via `Number.isInteger` and `> 0`), mirroring the schema's constraints; the schema stays the last line of defence.

## Risks / Trade-offs

- Base UI's Autocomplete is a client-side component: the first render is server-rendered like the rest, and the popup only works after hydration. Without JavaScript the field is a plain text input, which still submits.
- Two simultaneous creates with the same title can pick the same suffix → the second hits the UNIQUE constraint and the user sees an error page. Acceptable for a family-sized app; retry if it ever happens.
- A created recipe does not show on the home page until card #4 → the redirect to its page is the confirmation.
- The author is typed each time (no default from the signed-in email) → keeps the form honest about "who made this dish", which is not the same as who typed it in.
