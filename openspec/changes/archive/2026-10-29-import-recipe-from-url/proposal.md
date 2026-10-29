## Why

Many recipes start as a web page. Today a family member has to copy the title, every ingredient and every step into the editor by hand. Most recipe sites publish their recipe as structured data (schema.org `Recipe`), so a link is enough to prefill the form. Backlog card #24.

## What Changes

- A new page `/recepten/importeren` shows the new recipe form with an import box on top, and the menu gets a link "Recept importeren" right below "Nieuw recept". A family member pastes a web address, and the form is prefilled with the title, intro, servings, time, ingredients, steps and photo of that page. Nothing is saved until they save the form, as with any recipe.
- The page is read in the browser by a small hand-written reader of the page's schema.org `Recipe` data (JSON-LD, no site-specific code, no new dependency). A page without usable recipe data gives a message and leaves the form as it was; a page with partial data gives a partly filled form.
- The browser cannot fetch other sites itself (CORS), so the Worker gets two proxy endpoints that only fetch and hand back bytes: one for the page, one for its image. Parsing stays in the browser.
- The ingredient and step texts are handed to the editor as plain text; the existing recognition (quantities, units, chips, timers) does the rest.
- The photo is fetched through the image proxy and goes through the existing photo field (shrink, upload, preview), as if the family member had chosen it. A photo that cannot be fetched never stops the import.
- The imported address is filled in as the recipe's source (the field from `record-recipe-source`).
- Both proxies are limited: http(s) only, no private or local addresses (also after a redirect), a cap on redirects, size and time, a content-type check, and a rate limit per family member.

## Capabilities

### New Capabilities

- `recipe-import`: reading a recipe from a web address into the new recipe form, and the proxy that fetches pages and images for it, with its limits.

### Modified Capabilities

- `site-menu`: a link "Recept importeren" right below "Nieuw recept".
- `recipe-photo`: the photo field can be given an image from outside (the imported one) and handles it like a chosen photo.

## Impact

- Depends on `record-recipe-source` (the source field in the draft and the form); it must land first.
- No new dependency: `recipe-scrapers-ts` was checked and rejected (it only knows 27 named sites and has no generic schema.org reader).
- New routes in `src/app/routes/`: `import/` with the two proxy endpoints (server) and the import box (client). `routes.ts` gets two entries.
- New `ImportRecipePageRoute.tsx` beside `NewRecipePageRoute.tsx` (same editor, same save, plus the import box); `RecipeEditor.tsx` shows the box and applies an imported draft; `SiteMenu.tsx` gets the link. Depends on `tag-manager` landing first, because both change the menu requirement. `PhotoField.tsx`: accept an incoming image.
- Overlaps with `harden-requests` (security headers and the same-origin rule for data-changing requests): the proxies must work under both. See design.md.
- Possibly a rate limit binding in `wrangler.jsonc`.
- Out of scope: site-specific scrapers, importing tags, importing in the edit form or on the plain new recipe form, importing several recipes at once, and cleaning up photos of discarded forms (a separate change lists orphaned photos for admins).
