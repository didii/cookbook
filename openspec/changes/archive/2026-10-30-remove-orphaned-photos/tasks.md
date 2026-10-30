# Tasks

Needs `tag-manager`, `import-recipe-from-url` and `add-home-menu-item` merged first (all four change the menu requirement). Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec remove-orphaned-photos` lists the delta scenarios still without a test.

## 1. Design

- [x] 1.1 Design the page with the impeccable skill: approved as `docs/design/orphaned-photos.html` (see `docs/design/README.md`); the build tasks follow it

## 2. Finding and deleting

- [x] 2.1 `routes/admin-photos/lib/orphans.server.ts`: `findPhotos(db, bucket, { onlyUnused, onlyOld }, now)` (bucket listing through its cursor, image values of `recipes` and `steps` with the owning recipe's slug and title, `used` and `recent` per photo, filters applied before the cap of 100, oldest first, number of matches) and `deletePhotos(db, bucket, names)` (ignores names not shaped like a stored photo, re-checks "in use", returns `{ deleted, kept: [{ title, slug }] }`; the age of a photo does not stop a delete). Unit tests against in-memory D1 and R2: "Unused photo is listed", "Used photo is hidden by default", "Photo of a step is hidden by default", "Recent photo is hidden by default", "Used photo is shown without the filter", "Recent photo is shown without the filter", "Oldest first", "Only 100 are shown", "Chosen photos are deleted", "Photo used in the meantime", "Recent photo can be deleted", "Used photo cannot be deleted by request", "Unknown name"

## 3. Page

- [x] 3.1 `AdminPhotosPageRoute.tsx`: loader and action call `requireAdmin` first; the loader reads the two filters from the search params (both on when absent) and returns the first 100 matching photos, the number of matches and, per used photo, its recipe's slug and title; the action reads the names and answers `{ deleted, kept }`. Add `beheer/fotos` to `routes.ts` in the layout. Tests: "Admin opens the page", "User opens the page", "User sends a delete", "Filters are in the address"
- [x] 3.2 `lib/PhotoList.tsx` with testids, built from the approved design: filter chips (toggle buttons that update the address and clear the selection), totals line with "Alles selecteren" / "Niets", tiles (checkbox, or the book link for a used photo, or the clock for a recent one), bottom bar with "Verwijder selectie" only, the `<dialog>` confirmation (title, count and size, the form warning only with a recent photo, "Annuleer" focused, Escape and outside click close it), result message with links, empty state, cap note. Split the dialog into its own component if the file grows. Component tests: "Used photo cannot be selected", "Used photo links to its recipe", "Photo of a step links to its recipe", "Recent photo shows a clock", "Used and recent shows the book", "Totals", "Select all", "Select none", "Used photos are counted apart", "Changing a filter clears the selection", "Only 100 are shown", "Nothing to show", "Deleting asks to confirm", "Warning for recent photos", "No warning without recent photos", "Cancelling", "Confirming", "Result is reported", "Kept photos link to their recipes", "Kept photo shows its recipe", "All listed photos are deleted"

## 4. Menu

- [x] 4.1 `SiteMenu.tsx`: "Foto's" with `admin: true` after "Herkenning" and before "Gebruikers" (the list starts with "Home"); update the `site-menu` tests for the new order. Tests: the three menu list scenarios and "Photos link"

## 5. Wrap-up

- [x] 5.1 By hand with `pnpm dev`: upload a photo in the editor, discard the form, see the photo in the list once "Ouder dan 1 dag" is off (or wait out the 24 hours), delete it, confirm the recipe photos stay and that the book icon opens the right recipe
- [x] 5.2 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec remove-orphaned-photos`; all clean
