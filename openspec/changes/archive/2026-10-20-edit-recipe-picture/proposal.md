# Proposal

## Why

A recipe photo is currently a pasted link, which nobody in the family will have. On a phone, adding a picture (take one in the kitchen, or pick one from the gallery) is the main thing people will do on this screen. Photos therefore need real upload, with the file made small on the device so nobody can upload a 12 MB camera original. This is board card #12 ("Add a recipe photo"). The photo lives in the right rail that `edit-recipe-basics` creates, so that change comes first; this one is independent of the ingredients, steps and chips changes.

## What Changes

- The image link field is replaced by a photo field: a button that opens the camera or gallery (on a phone the OS offers both), the chosen photo shown at once in the same frame as on the recipe page (2:1, border and shadow, tile band beneath), with "Andere foto" and "Verwijder" actions.
- The photo is shrunk in the browser before upload: longest side at most 1600 px, re-encoded as WebP (JPEG where WebP is not available), orientation applied, never enlarged.
- New upload endpoint `POST /foto` stores the file in Cloudflare R2 (a new capability for the project: a bucket and a binding) after checking size (2 MB hard limit) and content; new `GET /foto/<file>` serves it to signed-in family members with long-lived caching.
- The recipe stores the photo's path in the existing `image` column; links already stored (including `/img/...` sample photos) keep working and are shown the same way.
- Saving a recipe whose photo was replaced or removed deletes the old uploaded file. A photo uploaded and then abandoned without saving stays in the bucket (accepted, see design).
- Errors are shown in text: unreadable file, upload failed (with retry), too large. Saving waits while an upload is running.
- The `ImagePreview` that previewed a typed link goes away; its framing moves into the photo field.

## Capabilities

### New Capabilities
- `recipe-photo`: adding, replacing and removing a recipe's photo from camera or gallery, client-side resizing, upload limits, storage and serving.

### Modified Capabilities
- `recipe-creation`: the form offers a photo instead of an image link (requirement "A new recipe can be added from the app"), and the link preview requirement is removed in favour of `recipe-photo`.

## Impact

- `wrangler.jsonc` (R2 bucket binding `PHOTOS`), `worker-configuration.d.ts` (regenerate), `app/routes.ts` (two resource routes), new `app/routes/photo/` (upload and serve), `app/.server/photos.ts`, `app/lib/resizeImage.ts`, `app/shared/recipeEditor/PhotoField.tsx`, `app/.server/recipes.ts` (`updateRecipe` returns the previous image), `testing/` (in-memory R2 for tests).
- New infrastructure: an R2 bucket must be created in the Cloudflare account before deploying. Cost at family scale: R2's free tier (10 GB, 1M writes a month) covers it; resized photos are about 200-400 KB.
- No schema change, no new dependency.
