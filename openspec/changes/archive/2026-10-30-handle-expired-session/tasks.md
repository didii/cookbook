# Tasks

Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec handle-expired-session` lists the delta scenarios still without a test.

## 1. Detect an expired session

- [x] 1.1 Add `src/app/shared/isSessionExpired.ts`: probe the current page with `redirect: 'manual'` and return true only for an `opaqueredirect` response; unit-test with an injected `fetch` (redirect, normal response, rejection)

## 2. Send the member to sign in

- [x] 2.1 In the `ErrorBoundary` of `root.tsx`, for a `TypeError` run the check; when it is true show "Opnieuw inloggen…" and call `location.reload()`, otherwise show the error as before; component tests for "Expired session while saving", "Expired session while opening a page", "No connection is not an expired session" and "Other failures are not an expired session" (stub `fetch` and `location.reload`, restore in `afterEach`)
- [x] 2.2 `test.todo` "Edits come back after signing in" pointing at the `recipe-draft` "A reload restores the draft" test, then check by hand with `pnpm dev` and a temporary 302 to another origin on POST in `handler.ts`: save a recipe, see the page reload instead of "Failed to fetch", edits still in the editor; also go offline and check the error page still shows. Remove the temporary 302.

## 3. Keep a note across the sign-in

- [x] 3.1 Add `notes/keptNote.ts` (key per member and recipe, stores text and base; `keepNote`, `takeNote`, storage failures ignored) with unit tests
- [x] 3.2 In `useNote`: when a save fails and `isSessionExpired(location.href)` is true, keep the text and `location.reload()`; after unmount keep without reloading; on mount take a kept text and pass it to `change` only when its base equals the stored note. `RecipeView` passes the member's email from the root loader data. Tests named "Note kept when the session expired", "Note comes back after signing in", "Note failure without an expired session" (mock `isSessionExpired`, stub `location.reload`)

## 4. Wrap-up

- [x] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec handle-expired-session`; all clean
