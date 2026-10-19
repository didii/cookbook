# Tasks

## 1. Storage and server routes

- [x] 1.1 Add the R2 bucket binding `PHOTOS` to `wrangler.jsonc`, run `pnpm cf-typegen`, and extend `testing/db.ts` with an in-memory R2 bucket; verify `pnpm typecheck` passes and a smoke test can put and get an object through the test helper.
- [x] 1.2 Add `app/.server/photos.ts` (`storePhoto` with size check, magic-byte sniffing and uuid naming; `getPhoto`; `deletePhoto`) with `photos.test.ts`; verify tests named `recipe-photo › Acceptable photo is stored`, `recipe-photo › Oversized file refused`, `recipe-photo › Other file types refused` (including a text file named `.jpg`) and `recipe-photo › Unknown photo` pass.
- [x] 1.3 Add the resource routes `POST /foto` and `GET /foto/:file` (headers: immutable cache, `nosniff`, ETag; only `<uuid>.<ext>` keys) in `routes.ts` and `routes/photo/`; verify with route tests named `recipe-photo › Photo is served` and a status check for 413 and 415 through the route.
- [x] 1.4 Make `updateRecipe` return the previous image and have the edit action delete the old uploaded photo after a successful write, and drop an `image` value that is neither empty, unchanged nor a `/foto/` path; verify with tests named `recipe-photo › Replaced photo is deleted` and `recipe-photo › Non-upload images are never deleted`, and that a forged external link is dropped.

## 2. Browser side

- [x] 2.1 Add `app/lib/resizeImage.ts` with `fitWithin` and `resizeImage.test.ts`; verify tests named `recipe-photo › Large photo is shrunk` (4000×3000 → 1600×1200) and `recipe-photo › Small photo is not enlarged` pass, plus portrait and square cases.
- [ ] 2.2 Build `PhotoField.tsx` in `shared/recipeEditor/` (file input with `accept="image/*"`, canvas resize with orientation and WebP→JPEG fallback, upload with states idle/uploading/done/error, retry, "Andere foto" and "Verwijder", frame with tile band and load-error text, busy reported to the save bar) replacing the image link field and `ImagePreview`; verify with `test.todo`s (a browser is needed, reason on the line above) named `recipe-photo › Chosen photo is shown at once`, `recipe-photo › Photo is stored with the recipe`, `recipe-photo › Photo can be replaced`, `recipe-photo › Photo can be removed`, `recipe-photo › Phone photo keeps its orientation`, `recipe-photo › Photo in the recipe frame`, `recipe-photo › Photo cannot be loaded`, `recipe-photo › Unreadable file`, `recipe-photo › Upload fails` and `recipe-photo › Saving waits for the upload`, and by hand in `pnpm dev` with a camera-sized JPEG, a PNG, a text file, a portrait phone photo and the network switched off.
- [ ] 2.3 Update the `recipe-creation` tests for the modified requirement (`recipe-creation › Time, intro and image are stored` now adds a photo path) and rename or remove the `recipe-creation` image-preview `test.todo`s that the removed requirement leaves behind; verify `pnpm test:spec edit-recipe-picture` reports every delta scenario covered or `test.todo`, and the spec check shows no test naming an unknown scenario.

## 3. Deploy notes and wrap-up

- [ ] 3.1 Document the one-time bucket creation (`wrangler r2 bucket create cookbook-photos`) where the project documents deployment and verify the command is spelled as the binding expects; check upload and display on a real phone against a deployed or `wrangler dev` instance.
- [ ] 3.2 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; verify all pass.
