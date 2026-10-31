# Tasks

## 1. Extract the page state (no behaviour change)

- [x] 1.1 With `remove-app-timers` merged, extract `lib/useCooking.ts` (tab and hash, ticks, servings and scaled values, timers, jump and flash, cook mode, scroll positions) and `lib/RecipeHead.tsx` (title, author, time, servings, source, intro, photo frame) from `RecipeView` and move `RecipeView` onto them; verify the existing `RecipeView.test.tsx` passes without edits and add `useCooking.test.tsx` / `RecipeHead.test.tsx` for the behaviour they now own

## 2. Public requests in the Worker

- [ ] 2.1 Add `isPublicRequest` and `publicRequestContext` (default `false`) and let `createFetch` skip `identify` for them without setting `userEmailContext`; verify `handler.test.ts` covers "Public page needs no identity proof", "Other pages stay closed", "Writing is refused", "Photo without identity", "Upload without identity" and that `.data` requests of `/share/…` count as public
- [ ] 2.2 Make `root.tsx`'s loader return an empty member for a public request without user lookup or welcome redirect; verify `root.test.tsx`
- [ ] 2.3 Add `X-Robots-Tag` for `/share/…` responses and the one-minute cache (Cache API keyed by URL, only 200, `cache` and `waitUntil` injectable); verify `handler.test.ts` covers "Public page is not indexed", "A missing public page is not indexed", "Other pages carry no such header", "Successful page is cacheable", "Repeat visits come from the cache" and "A 404 is not cached"

## 3. The page

- [ ] 3.1 Add `routes/recipe/SharePageRoute.tsx` (whitelist loader, 404, `meta`, no `recordView`) and register `share/:slug` outside the layout in `routes.ts`; verify `SharePageRoute.test.ts` against in-memory D1 for "Unknown recipe", "No member data in the response" and "Viewing is not recorded"
- [ ] 3.2 Add `routes/recipe/lib/SharedRecipeView.tsx` from `RecipeHead`, `useCooking` and the existing lists, with plain tag pills and no member parts; verify `SharedRecipeView.test.tsx` covers "Recipe content", "Scaling", "No in-app navigation or actions", "Tags are not links", "The source link stays", "Ticking an ingredient" and "Starting a timer", and a `test.todo` with reason for "Public page needs no identity proof" through a real browser if not automatable
- [ ] 3.3 Check the page in the browser at 390px and 1280px next to the recipe page, anonymous (no stand-in member) and with the console open for CSP or `/__manifest` errors; run `pnpm format:fix`, `pnpm lint:fix`, `pnpm test:spec share-public-page`, `pnpm test:ai`, `pnpm format:check` and `pnpm lint:check`

## Workflow follow-up

- Do not configure the Cloudflare Access Bypass for `/share/*` or `/foto/*` when merging this change; it is the last task of `share-connect`.
