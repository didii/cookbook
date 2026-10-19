# Design

## Context

`recipes.image` is a nullable text column; the form has a text field for it with an `ImagePreview` (frame, `aspect-2/1`, `TileBand`). Seed and sample images are static files under `public/img/`. The Worker (`workers/app.ts` via `createFetch`) wraps every request in the identity check, so any new route is behind Cloudflare Access like the rest. There is no object storage yet. Tests run D1 through Miniflare (`testing/db.ts`) without a browser. See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Choosing a photo on a phone is two taps; no giant uploads ever reach the server.
- Existing image paths keep working untouched.

**Non-Goals:**
- Several photos per recipe, step photos (the `steps.image` column stays unused), cropping or filters.
- Server-side re-encoding or thumbnails (the Images binding costs money; one resized size is enough).
- Cleaning up photos that were uploaded but never saved (see Risks).

## Decisions

- **R2 bucket `PHOTOS`.** Declared in `wrangler.jsonc` (`r2_buckets`), types regenerated with `pnpm cf-typegen`. Objects live at `photos/<uuid>.<ext>`; the uuid comes from `crypto.randomUUID()` on the server so a name is never guessable or chosen by the user. Chosen over storing images in D1 (blob size limits, row size, slower) and over a third-party host (the app is private; photos should stay behind Access).
- **Two resource routes** (`routes.ts`, no UI): `POST /foto` (upload) and `GET /foto/:file` (serve). Both use the existing `envContext`, so tests can pass a Miniflare R2 bucket, and neither needs extra auth.
- **Upload checks on the server.** Refuse by `Content-Length` first (cheap), then re-check the real size after reading (a client can lie about the header); 2 MB limit → 413. Sniff the magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`) and ignore the declared type and file name → 415. Store with the sniffed `contentType`. The response is JSON `{ path: "/foto/<uuid>.<ext>" }`. The resized client output is normally 200-400 KB, so 2 MB is a hard stop and not an expected path.
- **Serving.** Stream the R2 object body with its content type, `Cache-Control: private, max-age=31536000, immutable` (the name changes whenever the photo does), `ETag` from R2, and `X-Content-Type-Options: nosniff`. 404 when the key is missing. Only keys shaped `<uuid>.<ext>` are looked up, so the route cannot be used to read other objects.
- **The recipe stores the path.** `recipes.image` holds `/foto/<uuid>.<ext>`; sample paths like `/img/appeltaart.jpg` and any stored external link render exactly as before. The editor posts the current path as a hidden `image` field, so the recipe actions and `updateRecipe` do not change, except as below.
- **Resize in the browser, in two parts.** `lib/resizeImage.ts` holds the pure part, `fitWithin(width, height, max)` (scale down so the longest side is at most `max`, never up, rounded to whole pixels), unit-tested. `PhotoField` does the browser part: `createImageBitmap(file, { imageOrientation: 'from-image' })` (applies the camera's orientation), draw to a canvas of the fitted size, `canvas.toBlob('image/webp', 0.85)`; when the returned blob's type is not `image/webp` (older Safari silently returns PNG), re-encode as `image/jpeg` at 0.85 instead. A file the browser cannot decode (an unsupported HEIC, a renamed text file) shows "Deze foto kan niet worden gelezen" and keeps the old photo. Chosen over a resize library: the platform does it in a dozen lines.
- **`PhotoField` states.** `idle` (add button), `uploading` (the photo is already shown from an object URL, with a small busy label), `done` (path stored in the draft, "Andere foto" / "Verwijder"), `error` (text and "Opnieuw proberen", the resized blob is kept in memory so a retry does not decode again). The `Draft` gets no new key: the draft's `image` is the path once `done`, and the field reports `busy` upward so the save bar disables "Opslaan" with the label "Foto wordt geüpload…" while `uploading` or `error`. The field is an `<input type="file" accept="image/*">` without `capture`, so a phone offers camera and library; it is visually behind a normal button and reachable by keyboard.
- **Frame.** The old `ImagePreview` becomes the display part of `PhotoField` (same border, shadow, `aspect-2/1`, responsive `TileBand`, load-error text) with the "Andere foto" and trash buttons overlaid on the photo as in the mockup. The tile comes from the route as today.
- **Deleting replaced photos.** `updateRecipe` reads the previous `image` in the same statement batch and returns it; the action then deletes the R2 object when the previous value starts with `/foto/` and differs from the new one. D1 is written first, so a failed delete leaves an orphan and never a recipe pointing at a missing file.
- **Validation of the stored value.** The server only accepts an `image` that is empty, unchanged from what is stored, or a `/foto/<uuid>.<ext>` path; anything else is dropped. This keeps arbitrary links out now that nobody types them, without breaking recipes that already hold a link.
- **Tests.** `testing/db.ts` gains an in-memory R2 bucket (Miniflare `r2Buckets`), exposed to the photo tests and the route tests.

## Risks / Trade-offs

- A photo uploaded and then abandoned (tab closed, "Annuleren") is never referenced and stays in R2 → at a few hundred KB each and the free 10 GB, this is years of headroom; a later change can add an R2 lifecycle rule or a sweep of unreferenced keys.
- Client-side resizing is trusted for dimensions; only the 2 MB limit and the type are enforced server-side → acceptable for a private family app.
- HEIC from some browsers cannot be decoded in a canvas → clear text error; iOS normally converts to JPEG when a page asks for `image/*`.
- WebP re-encode quality 0.85 is a guess → tune against real kitchen photos during apply.
- The R2 bucket must exist before the first deploy → listed as a task with the exact command.

## Migration Plan

Create the bucket (`wrangler r2 bucket create cookbook-photos`), deploy. Existing recipes keep their `image` values. Rollback: remove the routes; stored values stay valid because they are plain paths.
