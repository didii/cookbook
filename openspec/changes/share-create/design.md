# Design

## Context

Likes and notes are written through small POST routes in `routes/recipe/` (`LikeUpdateRoute.ts`: form body, `getUser` check, 204/400/403/404) and keyed on `user_id`. Timestamps are ISO-8601 UTC text (`strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`). A modal `<dialog>` with `showModal()` is the popup pattern (`DeleteRecipe.tsx`). `lib/` sub-modules may not import each other: code that combines them stays in `lib/` (see STRUCTURE.md). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A link the member can create without thinking, that cannot be guessed and cannot be duplicated by opening the popup twice.
- An end date that is changed in one step and always visible.

**Non-Goals:**
- No page behind the link (`share-public-page`, `share-connect`).
- No overview or revoke (`share-overview`).
- No sliding expiry: it needs a write on every public GET, fights the edge cache, and link previews or bots would keep a link alive.

## Decisions

- **Table `recipe_shares`**: `id`, `token TEXT NOT NULL UNIQUE`, `recipe_id` (FK `recipes`, `ON DELETE CASCADE`), `user_id` (FK `users`, `ON DELETE CASCADE`), `expires_at TEXT` (NULL = never), `created_at`, and `UNIQUE (recipe_id, user_id)`. One share per recipe per member keeps the popup idempotent and the later overview one row per recipe. Alternative: many links per recipe; rejected, every open of the popup would add a dead link.
- **Token**: 16 random bytes from `crypto.getRandomValues`, base64url (22 characters, 128 bits). The slug is never part of the link, so a recipe's readable address says nothing about its share.
- **Get-or-create is one statement**, so two quick opens cannot make two tokens: `INSERT … ON CONFLICT (recipe_id, user_id) DO UPDATE SET token = excluded.token, expires_at = NULL, created_at = excluded.created_at WHERE recipe_shares.expires_at IS NOT NULL AND recipe_shares.expires_at <= ?` (the bound value is now), followed by a `SELECT` in the same `db.batch`. A live share is untouched; an expired one is replaced by a new token and starts at "never". An expired link is replaced instead of revived, so people holding the old link stay locked out.
- **Opening the popup is a POST** (`/recepten/:slug/delen`, `ShareCreateRoute.ts`), never a GET that writes. It answers `{ token, expiresAt, created }` as JSON (`created`: this call made or replaced the share, so the popup knows to open the dropdown on "Nooit" instead of "Wijzig"); 403 without a user row, 404 for an unknown recipe.
- **Changing the end date is a POST** (`/recepten/:slug/delen/verloop`, `ShareExpiryUpdateRoute.ts`) with `expires` = `24h | 7d | 1m | 6m | 1y | never`. It updates only the signed-in member's own live share of that recipe; answers `{ expiresAt }`, 400 for another value, 404 when the member has no live share of it (an expired share counts as none). The client sends the choice, not a date: the server clock decides.
- **Date arithmetic in `shareExpiry.ts`** (pure, in `shared/` because `share-overview` needs it): hours and days are exact; months and years are calendar months, clamped to the last day of the target month (31 January + 1 month = 28/29 February, not 3 March).
- **Data access in `shared/shares.server.ts`** (`getOrCreateShare`, `setShareExpiry`), because `share-connect` and `share-overview` will use the same table from other routes.
- **UI in `recipe/lib/share/`**: `ShareDialog` (modal `<dialog>`), `ExpiryPicker` (native `<select>`), `useShare` (the two fetches and their state). `RecipeView` owns the open state and passes `onShare` to `RecipeActionsMenu`; the menu does not import the share folder.
- **Share or copy**: after hydration the popup checks `typeof navigator.share === 'function'` (feature detection, not user-agent); with it the button is "Deel" and calls `navigator.share({ url })`, without it "Kopieer link" calls `navigator.clipboard.writeText` and shows "Gekopieerd". The link also sits in a read-only text field so it can be selected by hand if the clipboard is refused. An aborted share sheet is not an error.
- **Existing share with an end date**: the popup shows "Verloopt op {date}" (or "Verloopt nooit") and a "Wijzig" button; the button reveals the dropdown with a disabled "Kies…" placeholder, so no option is preselected and choosing any option, including the one that matches the stored date, saves. A share created by this very open shows the dropdown at once, on "Nooit".
- **Confirmation**: after the server accepts a choice the popup shows a checkmark and the new end date; a timer removes the checkmark after 2.5 seconds with a CSS fade, and without the fade for people who prefer reduced motion. Failed requests keep the previous end date and show an error line.
- **Dates** are shown with `Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' })` in the member's time zone. The link stops at the stored instant, not at the end of the shown day.

## Risks / Trade-offs

- [The link 404s until `share-public-page` and `share-connect` are merged] → accepted; merge them together, and the Access Bypass comes last (in `share-connect`).
- [Replacing an expired share changes the token] → intended; the popup shows the new link.
- [`navigator.share` exists on some desktop browsers] → feature detection follows the device's real capability; copying remains available through the text field.
- [Server and member clocks differ] → the server is the only clock for storing and checking.
