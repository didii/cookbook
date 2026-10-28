# Design

## Context

A photo is resized and uploaded to R2 (`photos/<uuid>.<ext>`) the moment it is chosen (`PhotoField`), and its path `/foto/<uuid>.<ext>` is stored in `recipes.image` only when the recipe is saved. Replaced or removed photos are deleted on save (`deletePhoto`) and a deleted recipe deletes its photo, but a form that is discarded, or a photo that is replaced before saving, leaves a file nothing points to. See proposal.md.

The photo helpers live in `shared/photos.server.ts` (`isPhotoPath`, `deletePhoto`, `getPhoto`). Admin pages call `requireAdmin` in loader and action. `steps.image` exists as a column (migration 0001); today only `recipes.image` is set, but both can hold a photo path and both are checked.

## Goals / Non-Goals

**Goals:**
- An admin can see which stored photos are unused and free the space, without any risk to a photo that is in use.

**Non-Goals:**
- Scheduled cleanup, restore after delete, other kinds of orphans.

## Decisions

- **Orphan = in the bucket under `photos/`, not in the set of image values of `recipes` and `steps`, and uploaded more than 24 hours ago.** The set is read with `SELECT image FROM recipes WHERE image LIKE '/foto/%' UNION SELECT image FROM steps WHERE image LIKE '/foto/%'` and compared by file name. The listing comes from `PHOTOS.list({ prefix: 'photos/' })`, followed through its cursor until done; its `uploaded` date and `size` are used as they are.
- **The 24 hours matter more than they look.** A photo is uploaded before its recipe is saved, so a form that is open right now has a photo no recipe uses yet. The age rule keeps it out of the list, and the delete re-checks it. A draft kept on a device can reach back further (drafts live up to 30 days), so deleting a photo that only a draft points to is possible; the editor then shows its existing "De foto kan niet worden getoond" message with replace and remove, and nothing else is lost. Accepted; stated on the page next to the delete button.
- **The server decides twice.** The loader computes the list; the action receives file names only and recomputes the orphan set before deleting, so a stale page cannot delete a photo that was linked in the meantime. Names that are not shaped like a stored photo (checked with the existing file name pattern through `isPhotoPath`) are ignored. The action answers how many were deleted and how many kept.
- **"Delete all" sends the names of the listed photos**, not a wildcard, so it deletes what the admin saw (minus anything that became used), not photos that appeared later.
- **Scan size:** the whole bucket is listed on each page load. That is fine for a family cookbook (hundreds of photos) and is marked with a `ponytail:` comment on the loop: add a page limit and cursor if the bucket ever reaches many thousands.
- **Place:** `routes/admin-photos/AdminPhotosPageRoute.tsx` (loader, action, page, `meta`), `lib/orphans.server.ts` (find and delete, takes `db` and `bucket`), `lib/PhotoList.tsx`. Route `beheer/fotos` goes in the layout beside `beheer/herkenning`. Nothing else uses these files, so nothing goes to `shared/`; `deletePhoto` and `isPhotoPath` are used from `shared/photos.server.ts`.
- **Thumbnails** use the existing `/foto/<file>` route with `loading="lazy"`; photos are already small (max 1600 px) and the list is capped in the page at 100 entries with a note that more remain after deleting (the delete-all button only covers the listed ones).
- **Confirmation** is a two-step button in the page (first press asks "Weet je het zeker? Verwijderde foto's komen niet terug.", second press deletes), not `window.confirm`, so it can be tested and styled.
- **Menu:** `site-menu` is modified with the full requirement text based on the versions in `tag-manager` and `import-recipe-from-url`, so this change lands after both. The link shows for `admin` and `superadmin`, after "Herkenning".
- **Visual design first.** Task 1 is a design pass with the impeccable skill (list layout, thumbnails, selection and delete states, empty state, mobile width); the tasks that build the page follow what it produces.

## Risks / Trade-offs

- [Deleting a photo that a stale draft needs] → See above; recoverable by choosing the photo again.
- [Race: a recipe saved between listing and deleting] → The action re-checks references right before each delete. A save in the few milliseconds between the check and the delete is still possible; accepted for an admin-only, rarely used page.
- [A bucket listing that grows] → One pass per page load; revisit past a few thousand photos.
- [Menu requirement conflicts when the three changes are archived] → Each delta is based on the previous one; archive in the order `tag-manager`, `import-recipe-from-url`, then this change.
