## Why

A photo is uploaded the moment it is chosen, not when the recipe is saved. A form that is then discarded, a photo that is replaced before saving, or a failed save leaves a file in the photo bucket that no recipe uses, and the planned recipe import (`import-recipe-from-url`) will make this more common. Nothing finds or removes these files, so storage only grows.

## What Changes

- A new admin page lists the stored photos, by default only those that no recipe uses (orphans) and that are older than a day: a thumbnail, the upload date and the size of each, at most 100 at a time. Two filters, "Ongebruikt" and "Ouder dan 1 dag", are on by default and kept in the address; turning them off shows every photo, for example to find near-duplicates.
- One line above the list shows the selection against the totals ("2/12 foto's", selected size out of total size) with "Alles selecteren" and "Niets".
- An admin can delete the selected photos; there is no delete-all button. A confirmation dialog comes first. A deleted photo is gone for good.
- A used photo is shown but cannot be selected; a book icon on its tile links to the recipe that uses it. A photo under a day old shows a clock and can be deleted, with a warning in the dialog, since its form may still be open.
- Safety: the server decides again when deleting. A photo that a recipe or step uses is never deleted, and the answer names the recipes of the photos it kept so the page can link to them. A save in the milliseconds between check and delete is accepted; uploading the photo again fixes it.
- The page is for admins and superadmins, like "Herkenning", and the menu gets a link "Foto's" after "Herkenning" for those roles.
- The visual design is approved: `docs/design/orphaned-photos.html`.

## Capabilities

### New Capabilities

- `orphaned-photos`: listing stored photos (by default those no recipe uses) and letting an admin delete the ones no recipe uses.

### Modified Capabilities

- `site-menu`: a link "Foto's" for admins and superadmins, after "Herkenning".

## Impact

- New route module `src/app/routes/admin-photos/` (page route plus a server-only `lib/orphans.server.ts`), and one entry in `routes.ts` (`beheer/fotos`).
- `SiteMenu.tsx`: one more admin link.
- Reads the `PHOTOS` bucket listing and the image columns of `recipes` and `steps` (with the owning recipe's slug and title); deletes through the existing `deletePhoto`. No migration, no new dependency, no new binding.
- Depends on `tag-manager`, `import-recipe-from-url` and `add-home-menu-item` landing first, because all four change the menu requirement.
- Out of scope: deleting automatically on a schedule, orphans other than photos, photos of deleted recipes (those are already deleted with the recipe), and browsing or restoring deleted photos.
