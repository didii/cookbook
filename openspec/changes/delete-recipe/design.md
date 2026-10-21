## Context

`routes/recipe/route.tsx` has only a loader; `RecipePage` ends with the steps and a `Fret`. The edit route already deletes a replaced photo after the write with `deletePhoto(...).catch(() => undefined)`. Foreign keys cascade (`ingredients`, `steps`, chips, `recipe_views`), so deleting the `recipes` row is enough. `ChipPopup` is a non-modal `<dialog>`; the sidebar change uses `showModal()`.

## Decisions

- **Action on the recipe route.** `action` on `recepten/:slug` does `DELETE FROM recipes WHERE slug = ?`, returning the old image; no new route. The button's form is `<Form method="post">`. 404 when no row was deleted; then delete the photo (failure ignored, like the edit route) and `redirect('/')`.
- **`deleteRecipe(db, slug)` in `.server/recipes.ts`.** Does the `DELETE ... RETURNING image` in one statement, so the photo path is known without a race. Returns `{ image } | undefined`.
- **Native modal `<dialog>`** (`showModal()`): focus trap and Escape for free. Click outside = click whose target is the dialog element itself (the backdrop), same approach as the sidebar menu. The dialog has no padding on the element itself; an inner div holds the content, so only the backdrop counts as "outside".
- **Component `routes/recipe/DeleteRecipe.tsx`**: button + dialog with confirm submit and cancel. Placed in `RecipePage` after the steps section, outside the tab panels, so it is visible on both tabs. On a narrow screen the tab panels use a min-height; the button sits below them, with the page's bottom padding.
- **Button style:** quiet text-weight button, not red-filled, so it is not pressed by accident; the confirm button in the popup is the strong one.
- **Draft/other state:** none stored per recipe on the client that needs cleaning (the edit draft only lives while editing).

## Risks

- `showModal()` may be missing in happy-dom; tests check the `open` attribute or use a stub in `~testing/dom`.
- Anyone in the family can delete any recipe, as they can edit any. Accepted; the popup is the only guard.
- **Orphaned photo.** The photo is deleted after the row, and a failure is swallowed (the recipe is gone, so the member still lands home). A failed delete leaves an R2 object in `cookbook-photos` (key `photos/<uuid>.<ext>`) that no recipe points to; the failure is logged with `console.error`. Accepted for now. Manual cleanup: list the keys of the `cookbook-photos` bucket in the Cloudflare dashboard (wrangler has no list command; the S3-compatible API also works), compare them with `SELECT image FROM recipes` (`wrangler d1 execute`, image is `/foto/<file>`), and delete unreferenced ones with `wrangler r2 object delete cookbook-photos/photos/<file>`. An admin page that finds and removes orphans is a later idea. The edit route has the same risk for a replaced photo.
