# Tasks

Needs `tag-manager` and `import-recipe-from-url` merged first (all three change the menu requirement). Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec remove-orphaned-photos` lists the delta scenarios still without a test.

## 1. Design

- [ ] 1.1 Design the page with the impeccable skill: list with thumbnail, date and size, selection, "delete selected" and "delete all", the two-step confirmation, result message, empty state, 100-entry cap note, phone width. Done when the user has approved the result; the build tasks follow it

## 2. Finding and deleting

- [ ] 2.1 `routes/admin-photos/lib/orphans.server.ts`: `findOrphans(db, bucket, now)` (bucket listing through its cursor, image values of `recipes` and `steps`, 24-hour rule, oldest first, totals) and `deleteOrphans(db, bucket, names, now)` (ignores names not shaped like a stored photo, re-checks, returns deleted and kept counts). Unit tests against in-memory D1 and R2: "Unused photo is listed", "Used photo is not listed", "Photo of a step is not listed", "Recent photo is not listed", "Totals", "Oldest first", "Chosen photos are deleted", "All photos are deleted", "Photo used in the meantime", "Recent photo cannot be deleted", "Unknown name"

## 3. Page

- [ ] 3.1 `AdminPhotosPageRoute.tsx`: loader and action call `requireAdmin` first; loader returns the first 100 orphans and the totals; action reads the names and answers the counts. Add `beheer/fotos` to `routes.ts` in the layout. Tests: "Admin opens the page", "User opens the page", "User sends a delete"
- [ ] 3.2 `lib/PhotoList.tsx` with testids, built from the approved design: thumbnails, selection, delete selected, delete all with two-step confirmation, result message, empty state. Component tests: "Nothing to remove", "Deleting asks for care", "Result is reported"

## 4. Menu

- [ ] 4.1 `SiteMenu.tsx`: "Foto's" with `admin: true` after "Herkenning" and before "Gebruikers"; update the `site-menu` tests for the new order. Tests: the three menu list scenarios and "Photos link"

## 5. Wrap-up

- [ ] 5.1 By hand with `pnpm dev`: upload a photo in the editor, discard the form, backdate or wait out the 24 hours (or temporarily lower the limit locally, not committed), see the photo in the list, delete it, confirm the recipe photos stay
- [ ] 5.2 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec remove-orphaned-photos`; all clean
