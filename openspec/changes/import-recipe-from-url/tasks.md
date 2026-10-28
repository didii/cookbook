# Tasks

Needs `record-recipe-source` merged first (the `source` field in the form and `DraftSeed`). Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec import-recipe-from-url` lists the delta scenarios still without a test.

## 1. Check the rate limit binding

- [x] 1.1 Check that the Workers Rate Limiting binding can be declared in `wrangler.jsonc` and runs under `pnpm dev`; if not, plan the fake only for tests

## 2. Fetching on the Worker

- [x] 2.1 `routes/import-fetch/lib/safeFetch.server.ts` with its test: address rules (scheme, credentials, `localhost`, `.local`/`.internal`, IPv4, IPv6, IPv4-mapped, odd notations), manual redirects with the address check on every hop and a limit of 5, size cap on a stream whatever `Content-Length` says, 10 s timeout, content-type check; tests inject `fetch`. Scenarios: "Other schemes refused", "Local and private addresses refused", "Address with credentials refused", "Redirect to a refused address", "Too many redirects", "Response too large", "Slow site", "Wrong kind of content"
- [x] 2.2 Rate limit: add the binding, `allow(key)` in the env context beside the other bindings, a fake for tests. Scenarios: "Limit reached", "Limits are per family member"
- [x] 2.3 `ImportPageFetchRoute.ts` and `ImportImageFetchRoute.ts`: read `{ url }` (exactly one string up to 2,000 characters), rate limit by the member's email, call `safeFetch`, answer the bytes with the statuses of design.md. Add both routes to `routes.ts` (`importeren/pagina`, `importeren/foto`). Route tests with a stubbed `fetch`: "Page is fetched", "Image is fetched", "Request body is checked", "Not a family member" (through `createFetch`)

## 3. Reading and mapping in the browser

- [x] 3.1 `edit-recipe/lib/import/readRecipe.ts`: hand-written JSON-LD reader with `DOMParser` as in design.md: `@graph`, arrays, `@type` arrays, `HowToSection`, single step string, tags in texts, yield and image forms; returns the shape of design.md or undefined. Unit test with saved HTML fixtures: "Page without a recipe", "Partly filled recipe"
- [x] 3.2 `edit-recipe/lib/import/toDraftSeed.ts`: pure mapping to `DraftSeed` plus image address. Check how `RecipeView` and the seed data write a time and use the same format. Tests: "Source is the imported address", "Author is not imported", "Servings are read from text", "Partly filled recipe"
- [x] 3.3 Test "Ingredients and steps are recognised" by feeding the mapped seed through `importedDraft` and checking the draft (quantity, unit, suggestions)

## 4. Photo field

- [x] 4.1 `PhotoField`: split the body of `choose` after reading the file into `take(blob)`, add the `incoming` prop (blob plus counter) handled by an effect. Component tests in `recipe-photo`: "Handed image is shown and uploaded", "Handed image replaces the current photo", "Handed image can be removed", "Handed image that is unreadable"

## 5. Import box

- [x] 5.1 `edit-recipe/lib/import/ImportBox.tsx` with testids: address field, button, message area. States: idle, busy (button disabled and says so), refused address, not fetched, no recipe. Fetches the page, calls `readRecipe`, calls `onImported(seed, imageUrl)`. Component test: "Address that is not a web address", "Page that cannot be fetched", "Page without a recipe", "Import waits and can be repeated"
- [x] 5.2 `RecipeEditor`: `canImport` prop, show `ImportBox` while the draft is clean, apply the seed with `importedDraft`, fetch the image through `/importeren/foto` and give it to `PhotoField` as `incoming`; a failed image shows the skipped message next to the photo field; Herstel clears the incoming image. Tests: "Form is prefilled", "Page without an image", "Photo is imported", "Image that cannot be used", "Import is offered only on an untouched form", "Import is not offered when editing", "Imported content is kept as a draft"
- [x] 5.3 `ImportRecipePageRoute.tsx` (heading "Recept importeren", `canImport`) with the loader and action shared with `NewRecipePageRoute`; add `recepten/importeren` to `routes.ts` above `recepten/:slug`. Tests: "Import page saves like a new recipe", "Import is not offered elsewhere"
- [x] 5.4 Menu: "Recept importeren" right below "Nieuw recept" in `SiteMenu.tsx` (all roles); update the `site-menu` tests for the new order: "Import link" and the three menu list scenarios
- [x] 5.5 `test.todo` for anything that needs a real browser, with the reason on the line above

## 6. Wrap-up

- [ ] 6.1 By hand with `pnpm dev`, three real recipe sites: prefill, photo, source, save, and the recipe page. Once `harden-requests` is in, repeat once and check the console for CSP violations
- [ ] 6.2 Add a line to `docs/security.md` for the fetch endpoints (guard, caps, rate limit and the DNS ceiling)
- [ ] 6.3 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec import-recipe-from-url`; all clean
