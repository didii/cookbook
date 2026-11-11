# Proposal

## Why

Family members want to send a recipe to someone outside the family without giving that person access to the cookbook. The sender needs a link they control: easy to create, with an end date, and not guessable.

## What Changes

- New table `recipe_shares`: one share per recipe per member, with a random token and an optional end date (none = never).
- The menu item "Deel" is enabled. It opens a popup that creates the member's share of that recipe, or reuses it, and shows the link `/share/<token>`.
- Opening the popup on a recipe the member already shares reuses the same link, unless that share has expired: then the old link is replaced by a new one and the share starts without end date.
- The link comes with a "Deel" button where the device has a share sheet, otherwise a "Kopieer link" button.
- A dropdown sets the end date: 24 uur, 7 dagen, 1 maand, 6 maanden, 1 jaar or Nooit (the default). Choosing saves at once and shows a checkmark that fades after a few seconds. The actual end date is always shown.
- Reopening an existing share shows its end date with a "Wijzig" button, which reveals the same dropdown without a preselected value.
- Deleting a recipe or a member deletes their shares.
- Not in this change: the page behind the link (`share-public-page`, `share-connect`), an overview of shares (`share-overview`), and any sliding expiry (a write on every public view; rejected).

## Capabilities

### New Capabilities

- `recipe-sharing`: creating and reusing a member's share link of a recipe, setting and showing its end date.

### Modified Capabilities

- `recipe-actions-menu`: "Deel" is no longer disabled.

## Impact

- `src/db/migrations/0018_recipe_shares.sql` and `migrations.test.ts`.
- New `src/app/shared/shares.server.ts` (get-or-create, set expiry) and `src/app/shared/shareExpiry.ts` (the choices and the date arithmetic), with tests.
- New routes `recipe/ShareCreateRoute.ts` and `recipe/ShareExpiryUpdateRoute.ts`, registered in `routes.ts`.
- New sub-module `recipe/lib/share/` (popup, expiry picker, hook); `RecipeView` opens it from the menu.
- Until `share-public-page` and `share-connect` land the link answers 404. Accepted: merge the three changes close together.
- Needs `recipe-actions-menu` archived first.
