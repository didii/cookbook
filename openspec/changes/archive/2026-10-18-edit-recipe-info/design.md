# Design

## Context

`/recepten/nieuw` has a form (title, author with autocomplete, optional servings) with server-side validation, accessible errors and focus handling, all inside `routes/new-recipe/`. `createRecipe` in `.server/recipes.ts` already accepts time, intro and image and reuses the stored spelling of an author that matches case-insensitively.

## Goals / Non-Goals

**Goals:**
- One form component for creating and editing; identical UI, only the starting data differs.
- Title, author, servings, time, intro and image editable, with the same validation and accessibility everywhere.

**Non-Goals:**
- A seal field in the form, ingredients, steps; image upload; deleting; changing the slug; recording who edited.

## Decisions

- **One `RecipeForm` in `shared/`.** Move the fields, `AuthorInput` and `validate` from `routes/new-recipe/` to `shared/RecipeForm.tsx`, `shared/AuthorInput.tsx` and `shared/recipeValidation.ts`. `RecipeForm` takes `authors`, `values` (a full set of field values, empty strings for a new recipe), `errors` and the submit button label, renders everything including the required-field legend and the focus-first-error effect, and posts to the current route. The create and edit routes render it with different values and nothing else; no UI is written in a route. The only allowed difference is the page heading and the button label, passed as props.
- **Fields.** Time: single-line text input. Intro: `<textarea>`, 4 rows. Image: text input (`type="text"`, `inputMode="url"`, label "Afbeelding (link)"), stored as given. All optional, none marked with the asterisk. Values are trimmed; an empty value is stored as NULL (time, image) or `''` (intro, the column is NOT NULL). No further validation: the recipe page already renders whatever image string is stored, and the field is for trusted family members.
- **Image preview.** Inside `RecipeForm` the image input is controlled (`useState`, initial value from `values`); below it, when the value is not empty, a frame like the recipe page's (`@container relative overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard`, an `aspect-2/1 object-cover` image with the bottom border, and a responsive `TileBand` beneath) shows the image, and an `onError` sets a flag that swaps the picture for a text "De afbeelding kan niet worden getoond." (`role="status"`), reset when the value changes. The preview sits in its own component (`ImagePreview.tsx` in `shared/`) that takes a `src` and a `tile` index, so the upload card can feed it an uploaded file's URL. The initial render is server-rendered from the stored value, so an edit shows the image without waiting for JavaScript. The tile comes from the route through `RecipeForm`: the edit loader gives `tileFor(recipe.id)` (what the recipe page shows), the create loader gives a random index from the loader, not from render, so server and browser agree. The preview is not part of the submitted form.
- **Seal on create.** `createRecipe` currently stores `recipe.seal ?? null` and nothing calls `pickSeal`. When no seal is given, `createRecipe` reads every stored seal (`SELECT seal FROM recipes WHERE seal IS NOT NULL`) and uses `pickSeal`. A seal passed in still wins, so seeds and tests can fix it. `pickSeal` changes: it drops the "skip the seals of the last three recipes" rule and picks at random among the seals used the fewest times (so its `existing` order no longer matters). `updateRecipe` writes the seal only when one is passed in (`seal = COALESCE(?, seal)`); the form never passes one. Recipes already stored without a seal keep none (the page already copes with that); backfilling is not part of this change.
- **Route `/recepten/:slug/bewerken`** (`routes/edit-recipe/`), declared in `routes.ts`. The loader returns the recipe's current values and the authors, and throws 404 for an unknown slug. The action validates, calls `updateRecipe` and redirects to `/recepten/<slug>`. Invalid input returns `data({errors, values}, {status: 400})`, as when creating.
- **`updateRecipe(db, slug, fields)`** takes the same base fields as `createRecipe` (title, author, servings, time, intro, image) and returns whether a recipe matched (`meta.changes`). It sets `updated_at` and applies the same `COALESCE((SELECT author … COLLATE NOCASE …), ?)` spelling rule, with one difference: the subselect ignores the recipe being edited (`AND slug != ?`). Otherwise changing "Oma" to "oma" on the only "Oma" recipe would keep "Oma". An omitted optional field writes NULL (or `''` for intro), so emptying a field removes its value. Ingredients and steps are not touched.
- **Slug stays.** Changing the title does not change the address: links and bookmarks keep working and no uniqueness handling is needed.
- **Entry point:** a text link "Bewerk" in the title area of the recipe page, with a touch target of at least 44px. No new header item: editing belongs to one recipe.
- **Unknown slug on POST:** the action also answers 404 when `updateRecipe` matched nothing.

## Risks / Trade-offs

- An image given as text can be a broken link, and there is no preview → accepted until a card adds uploads.
- Two people editing the same recipe: last write wins, no conflict detection. Fine for a family app.
- Slug and title can drift apart after renames → accepted, see above.
- Anyone signed in can edit any recipe (same trust model as the rest of the app).
