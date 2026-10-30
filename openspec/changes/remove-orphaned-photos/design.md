# Design

## Context

A photo is resized and uploaded to R2 (`photos/<uuid>.<ext>`) the moment it is chosen (`PhotoField`), and its path `/foto/<uuid>.<ext>` is stored in `recipes.image` only when the recipe is saved. Replaced or removed photos are deleted on save (`deletePhoto`) and a deleted recipe deletes its photo, but a form that is discarded, or a photo that is replaced before saving, leaves a file nothing points to. See proposal.md.

The photo helpers live in `shared/photos.server.ts` (`isPhotoPath`, `deletePhoto`, `getPhoto`). Admin pages call `requireAdmin` in loader and action. `steps.image` exists as a column (migration 0001); today only `recipes.image` is set, but both can hold a photo path and both are checked.

## Goals / Non-Goals

**Goals:**
- An admin can see the stored photos, by default the ones nothing uses, and free the space, without any risk to a photo that is in use.
- With the filters off, an admin can look at every photo, for example to find near-duplicates.

**Non-Goals:**
- Scheduled cleanup, restore after delete, other kinds of orphans.
- Deleting a photo that a recipe uses, or deleting everything with one button.

## Decisions

- **The page lists the bucket, filtered.** An orphan is a photo in the bucket under `photos/` that is not in the set of image values of `recipes` and `steps`. The set is read with a query that returns the image and the owning recipe for both tables (`recipes.image` with its own slug and title; `steps.image` joined to its recipe), restricted to `/foto/%`, and compared by file name. The listing comes from `PHOTOS.list({ prefix: 'photos/' })`, followed through its cursor until done; its `uploaded` date and `size` are used as they are. Each listed photo carries `used` (with the recipe's slug and title when used, the first one if several recipes share the photo) and `recent` (uploaded less than 24 hours ago).
- **Two filters, in the address.** `Ongebruikt` hides used photos, `Ouder dan 1 dag` hides recent ones. Both are on by default. They are search params (absent means on; an `=0` style value turns one off), read by the loader, which applies them before the 100 cap, so the cap always counts matching photos. Chips are toggle buttons (`aria-pressed`); changing one clears the selection and any open confirmation.
- **The 24 hours are a default view, not a safety rule.** A photo is uploaded before its recipe is saved, so a form that is open right now has a photo no recipe uses yet; the default filter keeps it out of sight. An admin who turns the filter off may delete it. Accepted: a stale or open form then shows the editor's existing "De foto kan niet worden getoond" message with replace and remove, and re-uploading fixes it. The same goes for a draft kept on a device (drafts live up to 30 days). The dialog warns when the selection holds a recent photo. Only "in use" blocks a delete.
- **The server decides twice, on "in use" only.** The loader computes the list; the action receives file names only and recomputes the used set before deleting, so a stale page cannot delete a photo that was linked in the meantime. Names that are not shaped like a stored photo (checked with the existing file name pattern through `isPhotoPath`) are ignored. The action answers `{ deleted, kept: [{ title, slug }] }`, the kept entries being photos that a recipe or step started to use.
- **No delete-all.** "Alles selecteren" then "Verwijder selectie" does it. The names sent are the selected, listed ones, never a wildcard.
- **Used photos are shown but locked.** A used tile has no checkbox and a muted book icon at the bottom right of its footer, linking to the recipe (`/recepten/<slug>`, in a new tab). A recent unused tile shows a yellow (warning-colour) clock in the same place, not a link, and can be selected. The book wins when both apply. The link needs the recipe slug in the loader data, which the used-set query already returns.
- **Totals line.** `n/m foto's`, then the selected size out of the total size, then `Alles selecteren` and `Niets`, all in the line above the chips; m and the sizes count the selectable listed photos only. The count of used listed photos is added as "· k in gebruik". This replaces the count row of the fixed bottom bar, which now holds only "Verwijder selectie" and so takes less locked screen height.
- **Scan size:** the whole bucket is listed on each page load. That is fine for a family cookbook (hundreds of photos) and is marked with a `ponytail:` comment on the loop: add a page limit and cursor if the bucket ever reaches many thousands.
- **Place:** `routes/admin-photos/AdminPhotosPageRoute.tsx` (loader, action, page, `meta`), `lib/orphans.server.ts` (find and delete, takes `db` and `bucket`), `lib/PhotoList.tsx`. Route `beheer/fotos` goes in the layout beside `beheer/herkenning`. Nothing else uses these files, so nothing goes to `shared/`; `deletePhoto` and `isPhotoPath` are used from `shared/photos.server.ts`.
- **Load:** thumbnails use the existing `/foto/<file>` route with `loading="lazy"`, at full stored size (max 1600 px, 2 MB cap). With the cap of 100 tiles a page load is at most about 40 MB, usually less because only visible tiles load; photos are cached for a year, and R2 egress is free. No resizing is added; revisit if the bucket reaches thousands of photos.
- **Confirmation** is a native `<dialog>` opened with `showModal()`, not `window.confirm`, so it can be tested and styled. It sits in the middle of the screen, away from the delete button, so the second click of a double click lands outside it. Focus starts on "Annuleer"; Escape and a click outside close it. Title "Weet je het zeker?", text "N foto's, size." and, only for a selection with a recent photo, the form warning; the button reads "Verwijder N foto's". It no longer says that deleted photos cannot be brought back.
- **Result:** after a delete the page shows "N foto's verwijderd." and, if some were kept, "K foto's bewaard, want een recept gebruikt hem intussen:" followed by links to those recipes. The kept photos stay in the list as used tiles.
- **Menu:** `site-menu` is modified with the full requirement text based on the versions in `tag-manager` and `import-recipe-from-url`, so this change lands after both. The link shows for `admin` and `superadmin`, after "Herkenning".
- **Visual design:** done and approved in `docs/design/orphaned-photos.html` (see `docs/design/README.md`); the build follows it.

## Risks / Trade-offs

- [Deleting a photo that an open form or a stale draft needs] → See above; recoverable by choosing the photo again. The dialog warns for photos under a day old.
- [Race: a recipe saved between listing and deleting] → The action re-checks references right before each delete and reports the kept photos with their recipes. A save in the few milliseconds between the check and the delete is still possible; accepted for an admin-only, rarely used page, and fixed by uploading the photo again.
- [Data use on a phone with the filters off] → Up to about 40 MB per page load; accepted for an admin page.
- [A bucket listing that grows] → One pass per page load; revisit past a few thousand photos.
- [Menu requirement conflicts when the three changes are archived] → Each delta is based on the previous one; archive in the order `tag-manager`, `import-recipe-from-url`, then this change.
