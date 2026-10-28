## Why

A photo is uploaded the moment it is chosen, not when the recipe is saved. A form that is then discarded, a photo that is replaced before saving, or a failed save leaves a file in the photo bucket that no recipe uses, and the planned recipe import (`import-recipe-from-url`) will make this more common. Nothing finds or removes these files, so storage only grows.

## What Changes

- A new admin page lists the stored photos that no recipe uses (orphans): a thumbnail, the upload date and the size of each, plus the total count and size.
- An admin can delete selected orphans, or all listed orphans at once. A deleted photo is gone for good.
- Safety: the server decides what is an orphan, both when listing and again when deleting. A photo that a recipe or step uses is never deleted, and a photo uploaded in the last 24 hours is never listed, because its form may still be open.
- The page is for admins and superadmins, like "Herkenning", and the menu gets a link "Foto's" after "Herkenning" for those roles.
- The page needs a visual design made with the impeccable skill before it is built.

## Capabilities

### New Capabilities

- `orphaned-photos`: finding stored photos that no recipe uses and letting an admin delete them.

### Modified Capabilities

- `site-menu`: a link "Foto's" for admins and superadmins, after "Herkenning".

## Impact

- New route module `src/app/routes/admin-photos/` (page route plus a server-only `lib/orphans.server.ts`), and one entry in `routes.ts` (`beheer/fotos`).
- `SiteMenu.tsx`: one more admin link.
- Reads the `PHOTOS` bucket listing and the image columns of `recipes` and `steps`; deletes through the existing `deletePhoto`. No migration, no new dependency, no new binding.
- Depends on `tag-manager` and `import-recipe-from-url` landing first, because all three change the menu requirement.
- Out of scope: deleting automatically on a schedule, orphans other than photos, photos of deleted recipes (those are already deleted with the recipe), and browsing or restoring deleted photos.
