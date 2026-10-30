## Why

When a member's Cloudflare Access session expires, Access answers every request with a redirect to its sign-in page on another origin. A page navigation follows that redirect, but the `fetch()` calls the app makes (saving a recipe, liking, saving a note, client-side page loads) fail with `TypeError: Failed to fetch`, and the member sees that raw error with no way to know they only need to sign in again. This was found while reviewing the CSP of the `harden-requests` change; it is not caused by it and also happens without it.

## What Changes

- When a request made by the app fails, the app checks whether the cause is an expired Access session. If so, it sends the member to sign in again (a full page load of the page they were on, which Access redirects to its sign-in) instead of showing the error.
- A failure with another cause (no connection, a server error) keeps showing the error as now.
- Unsaved edits in the recipe editor are not lost: the editor's draft is already kept on the device, and the page they return to after signing in restores it.
- A note whose save fails is handled by the note itself (it never reaches the `ErrorBoundary`). When the same check shows an expired session, the note text is kept on the device, the page is loaded again to sign in, and the note field shows the text again afterwards.

## Capabilities

### New Capabilities

- `session-expiry`: what the app does when a request fails because the Access session expired.

### Modified Capabilities

None. `family-access` and `recipe-draft` keep their requirements; this change relies on the existing "A reload restores the draft" behavior.

## Impact

- `src/app/root.tsx`: the `ErrorBoundary` recognizes the failure and starts the sign-in.
- `src/app/routes/recipe/lib/notes/`: `useNote` runs the check when a save fails and keeps and restores the note text (a small storage module beside it).
- A new helper in `src/app/shared/` that tells an expired session from other failures, with tests.
- No data, migration, dependency or Worker changes.
- Out of scope: warning before the session expires, silently renewing it, and the Access session length (Cloudflare dashboard).
