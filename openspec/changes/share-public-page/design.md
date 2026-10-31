# Design

## Context

- `handler.ts` verifies the Access JWT first (`identify`) and answers 403 without one; then it puts `userEmailContext`, `envContext` and `importAllowContext` in the router context. Cloudflare Access also sits in front of the custom domain.
- `root.tsx`'s loader reads `userEmailContext`, looks the member up and redirects to the welcome screen when there is no user row.
- `RecipeView` (one 300-line component) holds the page state (tab, ticked ingredients, servings, timers, cook mode, scroll bookkeeping) and also member features (like, actions menu, notes). The reusable parts sit in `routes/recipe/lib/`. STRUCTURE.md: a route imports only from `shared/`, never from another route.
- `PhotoFetchRoute` serves `/foto/:file` from R2 under uuid names.
- See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A page that looks like the recipe page and can only show what a recipe contains.
- No code path from a public request to member data: it must fail instead of leaking.
- Reuse the reading components without coupling the two views.

**Non-Goals:**
- No share token, expiry or revoke (`share-connect`), no creation of shares (`share-create`).
- No Access Bypass, WAF or other Cloudflare configuration yet.
- No sitemap, no `robots.txt` (see below).

## Decisions

- **Separate view, same route module.** The public page lives in the recipe module (`routes/recipe/`), like import and edit live next to the new-recipe page: `SharePageRoute.tsx` beside `RecipePageRoute.tsx`, and `lib/SharedRecipeView.tsx` beside `RecipeView.tsx`. It imports the existing parts straight from `lib/` (`IngredientList`, `StepList`, `scale/`, `timers/`, `cook/`, `tabs/`, the hooks), so nothing moves to `shared/` and no file is renamed. `RecipeView` gets no read-only mode: the new view simply never renders `LikeButton`, `RecipeActionsMenu`, `NotePanel` or `NoteSheet`.
- **Two small extractions so the views do not drift.** `useCooking(recipe, steps)` in `lib/` holds the page state both views need (tab and hash, ticks, servings and scaled values, timers, jump and flash, cook mode, scroll positions) and returns it; `RecipeHead` renders title, author, time, servings, source, intro and the photo frame with seal and tile band. Neither takes a member, email or slug-based member data. `RecipeView` is moved onto them first, with its tests unchanged, before the new view exists. Alternative: copy the 100 lines of state into the new view, rejected because a fix in one would then silently miss the other; the leak risk lives in data, not in layout state, and the hook gets none. This is the one place to push back on in review.
- **The route sits outside `layout(...)`** so there is no header, menu or member data. `SharePageRoute.tsx` has a loader that selects an explicit whitelist of recipe fields (title, author, time, servings, intro, source, image, seal, tags, ingredients, steps with their chips, quantities, timers, a tile number) instead of passing `Recipe` through, so a field added to `Recipe` later is not public by accident. It never reads `userEmailContext` and never calls `recordView`.
- **Public requests are decided in one place.** `handler.ts` gets `isPublicRequest(request)`: method GET or HEAD and a path of `/share/<one segment>` (with or without the `.data` suffix of React Router's data requests) or `/foto/<one segment>`. For these it skips `identify`, does not set `userEmailContext` and sets a new `publicRequestContext` (default `false`). Everything else, including `POST /foto` and any non-GET on `/share/…`, goes through `identify` as before. Alternative: per-route opt-out in each loader; rejected, the check must be before identity and in one reviewed place.
- **Fail closed.** Because `userEmailContext` is unset on a public request, any loader that asks for the member throws instead of leaking. `root.tsx`'s loader checks `publicRequestContext` first and, for a public request, returns the same shape with an empty `email`, role `user` and no user lookup, welcome redirect or member-only rules lookup.
- **Not indexed: a header, no `robots.txt`.** The Worker adds `X-Robots-Tag: noindex, nofollow` to every `/share/…` response, including 404s. A `Disallow` would stop crawlers from reading that header and a linked URL could still be indexed; and `robots.txt` is behind Access anyway.
- **Short cache for a traffic spike.** Successful (200) public `/share/…` GETs get `Cache-Control: public, max-age=60` and the Worker stores them in the Cache API (`caches.default`, keyed by URL), so repeated hits within a minute do not reach D1. 404s are not cached. Cost: a removed or expired link can keep working for up to a minute. `createFetch` takes the cache and `ctx.waitUntil` as options so tests can pass fakes.
- **Photos.** `GET /foto/<file>` becomes public with the same check; names are random uuids and the route already returns 404 for names of another shape. Uploading (`POST /foto`) stays closed.
- **Look.** The new view renders what `RecipeView` renders minus: "Alle recepten", `LikeButton`, `RecipeActionsMenu`, `NotePanel`/`NoteSheet`, and the tag links (tags become plain pills). The source link to an outside address stays: it is part of the recipe. Cook mode and the tab bar stay. The `ServiceWorker` and manifest link live in `root.tsx` and are left alone; their requests fail quietly for visitors without a session.

## Risks / Trade-offs

- [Every recipe is public under its slug while only this change exists] → the Access Bypass is the real gate and is the last task of `share-connect`; both proposals say so. Nothing in this change tells Cloudflare to let the path through.
- [A bug lets member data into the public page] → whitelist loader, no `userEmailContext`, test that the response contains no email and that no `recipe_views` row appears.
- [Moving `RecipeView`'s state into `useCooking` is a refactor of a busy component] → it is its own commit, with the existing `RecipeView` tests unchanged as the proof.
- [Cache keeps a revoked link alive for a minute] → accepted and written in the spec.
- [React Router lazy route discovery asks `/__manifest` from a public page] → the page has no internal `<Link>`, so it does not; check in the browser.

## Migration Plan

1. Merge after `remove-app-timers`.
2. Deploy: nothing changes for visitors, because Access still blocks the path.
3. Do not add the Access Bypass; that happens in `share-connect`.
