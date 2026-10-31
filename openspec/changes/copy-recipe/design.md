# Design

## Context

- `NewRecipePageRoute` loader gives the empty seed (`emptyDraftSeed` plus the member's calling name); `EditRecipePageRoute` already maps a stored recipe to a `DraftSeed` (`joinIngredient` for lines, steps with chips, oven temperature and timer).
- `RecipeEditor` starts from the draft on the device unless `isFresh(location.state)` says to throw it away (what the edit link uses).
- `acceptImage(submitted, stored)` accepts any well-formed `/foto/<uuid>.<ext>` path on a save, and `deleteRecipe` and the orphaned-photo cleanup delete the file a recipe points to. Two recipes pointing at one file would lose their photo together. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A faithful prefill with no write until the member saves.
- A copy that stands on its own, photo included.

**Non-Goals:**
- No link kept between a copy and its original.
- No "Kopie van" title prefix: the title is copied as is and the slug is made unique as for any new recipe.

## Decisions

- **`/recepten/nieuw?kopie=<slug>` on the existing route.** The loader reads the optional parameter and, for a stored recipe, returns its seed; otherwise the empty one. No new route and no write on GET. Alternative: a POST that creates the copy right away; rejected, the request was to open the form first.
- **One mapping stored recipe → seed.** The mapping now in `EditRecipePageRoute` moves to a function in `routes/edit-recipe/lib/` used by both loaders, so a copy and an edit cannot disagree about what a recipe's fields look like.
- **The form takes its seed from the loader** (`loaderData.seed`, default the empty seed with the calling name), instead of building it inside `NewRecipeForm`. Import and the plain new page keep working with the default.
- **Draft handling.** The menu item is a `Link` with `state={{ fresh: true }}`, the same flag the edit link uses, so a stale new-recipe draft is dropped and the copy is shown. After that a reload restores the member's own changes.
- **Photo.** The seed carries the original's `/foto/…` path, so the form shows the photo. On save, if the accepted image path is already used by another recipe, the action copies the file in R2 to a new uuid name (`copyPhoto` in `photos.server.ts`) and stores the new path. Rule: a photo file belongs to one recipe. This is checked in the action instead of the loader so that opening the form writes nothing, and it also protects against any other path that submits an existing photo.
- **Ingredients and steps** are seeded as stored; the editor builds its chips as it does for an edit.
- **Menu.** "Kopieer" becomes a `Link` in `RecipeActionsMenu`; the menu already closes on choosing an item.

## Risks / Trade-offs

- [Photo copy fails after the recipe row is written] → copy first, then create the recipe with the new path; on a failed copy the recipe is saved without a photo and the form is not blocked.
- [A member copies, never saves] → nothing was written; the unsaved photo path was never copied.
- [The seed shows the original's photo and the member removes it] → the form clears the image field as it does today; nothing to copy.
