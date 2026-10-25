## Context

`DeleteRecipe` is a button plus a `<dialog>` with a `Form` that posts to the recipe page, whose `action` deletes. The edit page has its own `action` (save), so a form posting there would save, not delete.

## Decisions

- **Own route for the action.** `RecipeDeleteRoute.ts` at `recepten/:slug/verwijderen`, action-only, named like `LikeUpdateRoute`. The action body moves unchanged from `RecipePageRoute`. The `Form` in `DeleteRecipe` gets `action={`/recepten/${slug}/verwijderen`}`. Alternative, posting to the recipe page and keeping its action, leaves an action on a page that has no form for it.
- **Component moves to `edit-recipe/lib/`.** Only that route uses it now (STRUCTURE: colocate). It gets a `slug` prop.
- **Placement.** Rendered in `RecipeEditor` after `</Form>`, only when `slug` is set. It must sit outside the save `Form`: forms cannot nest, and the save bar must not hold it. The dialog is modal, so the sticky save bar does not matter while it is open.
- **Unsaved changes.** Deleting while the draft is dirty leaves the page by a redirect; the leave guard may ask first. Accepted: the guard stays as is.

## Risks

- A bottom-of-page button can sit behind the sticky save bar on a phone; keep bottom padding as `RecipeView` does today (`max-[51.99rem]:pb-16`) if the save bar overlaps it.
