# Proposal

## Why

A recipe can be created and viewed but not corrected. A family member needs to fix a typo in the title, change the author or the number of servings. This is board card #10, "Edit a recipe", limited to the base information of a recipe (everything except ingredients and steps, which are separate cards). The base information also includes preparation time, intro and image, which the create form does not offer yet, so they have to be added there too.

## What Changes

- A "Bewerk" link on the recipe page leads to `/recepten/<slug>/bewerken`.
- Creating and editing use one and the same form component with the same UI. Only the starting data differs: empty for a new recipe, the stored values for an edit. Each route keeps its own loader and action.
- The form gets three new optional fields: preparation time (text, e.g. "45 min"), intro (multi-line text) and image (a URL or path as text, like it is stored today). They appear in both "Nieuw recept" and "Bewerk".
- Submitting an edit saves the changes and redirects to the recipe page; invalid input re-shows the form with errors and saves nothing, as when creating. Emptying an optional field removes its value.
- The slug (and so the page address) does not change when the title changes.
- The image link is previewed in the form as it is typed (and for a stored image), in the same frame as on the home and recipe pages: same border and shadow, the recipe page's 2:1 proportions and a tile band beneath (random for a new recipe, the recipe's own for an edit). It says so in text when the image cannot be loaded. The same preview will later show an uploaded image.
- The seal is not part of the form: it is chosen automatically. Checking this found that `createRecipe` stores no seal unless one is given (`pickSeal` in `lib/seals.ts` exists but nothing calls it), so a created recipe never gets one. This change makes creating pick a seal at random among the least used ones (a seal passed in still wins). Editing keeps the seal unless one is passed in. The form shows no seal.
- Ingredients and steps are not part of the form yet.
- The form, author input and validation move from `routes/new-recipe/` to `shared/` since two routes use them.

## Capabilities

### New Capabilities
- `recipe-editing`: A family member can change the base information of a stored recipe, using the same form as for a new recipe.

### Modified Capabilities
- `recipe-creation`: the form also offers time, intro and image with a preview, and a new recipe gets an automatically chosen seal.
- `recipe-viewing`: the recipe page links to the edit form.

## Impact

- `packages/web/app/routes.ts`, new `app/routes/edit-recipe/` route, `app/.server/recipes.ts` (`updateRecipe`), `app/routes/recipe/route.tsx` (link), `app/routes/new-recipe/` (form code moves to `app/shared/`, route passes empty values).
- No schema change (time, intro and image columns exist), no new dependency.
