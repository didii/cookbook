# Tasks

## 1. Seed and photo

- [x] 1.1 Move the stored-recipe-to-seed mapping out of `EditRecipePageRoute.tsx` into one function in `routes/edit-recipe/lib/` used by both loaders; verify the edit page tests pass unchanged and add a unit test for the mapping
- [x] 1.2 Add `copyPhoto(bucket, path)` to `shared/photos.server.ts` (new uuid name, same content and type) and use it in the new-recipe action when the accepted image path is already used by another recipe; verify `photos.server.test.ts` and `NewRecipePageRoute.test.ts` cover "The copy gets its own photo" and "Deleting the original keeps the copy's photo"

## 2. The copy form

- [x] 2.1 Read `kopie` in the `NewRecipePageRoute` loader, return the seed (empty for an unknown slug) and let `NewRecipeForm` use `loaderData.seed`; verify `NewRecipePageRoute.test.ts` covers "The form is filled in from the recipe", "Opening the copy stores nothing", "Saving the copy makes a new recipe" and "Unknown recipe", and that the plain new page and the import page still start empty
- [x] 2.2 Check that the editor starts fresh for the copy (`state={{ fresh: true }}`) and keeps the member's changes on reload; verify `NewRecipeForm.test.tsx` or `RecipeEditor.test.tsx` covers "The copy replaces an old draft" and "A reload keeps the copy's changes"

## 3. Menu

- [ ] 3.1 Make "Kopieer" a `Link` to `/recepten/nieuw?kopie=<slug>` with `state={{ fresh: true }}` in `RecipeActionsMenu`; remove the "Kopieer is disabled" test; verify `RecipeActionsMenu.test.tsx` covers "Kopieer links to the copy form"
- [ ] 3.2 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm test:spec copy-recipe`, `pnpm test:ai`, `pnpm format:check` and `pnpm lint:check`; copy a recipe with a photo in the browser, save it, delete the original and check the copy's photo
