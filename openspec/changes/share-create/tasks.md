# Tasks

## 1. Database and data access

- [x] 1.1 Add migration `0018_recipe_shares.sql` (`recipe_shares` with unique token, `UNIQUE (recipe_id, user_id)`, cascades on recipe and user); verify `migrations.test.ts` covers "Deleting a recipe deletes its shares" and "Deleting a member deletes their shares"
- [x] 1.2 Add `shared/shareExpiry.ts` (the six choices, `expiryFor(choice, now)` with calendar months clamped to the last day); verify `shareExpiry.test.ts` covers hours, days, "A month ends on the last day when needed", leap years and "never"
- [x] 1.3 Add `shared/shares.server.ts` (`getOrCreateShare`, one upsert statement plus select in one batch; `setShareExpiry` for the owner's live share) with random 128-bit base64url tokens; verify `shares.server.test.ts` (db fixture) covers "The first share creates a link", "Opening again shows the same link", "Another member has their own link", "Tokens are long and different", "Expired share is replaced", "A live share is not replaced" and the owner/expired refusals

## 2. Routes

- [x] 2.1 Add `recipe/ShareCreateRoute.ts` (POST `/recepten/:slug/delen`, JSON `{ token, expiresAt }`, 403 without user row, 404 unknown recipe) and register it in `routes.ts`; verify `ShareCreateRoute.test.ts`
- [x] 2.2 Add `recipe/ShareExpiryUpdateRoute.ts` (POST `/recepten/:slug/delen/verloop` with `expires`, 400/404 as designed) and register it; verify `ShareExpiryUpdateRoute.test.ts` covers "Another member's share is refused", "An expired share is refused", "Unknown choice is refused", "A choice is stored at once", "Nooit removes the end date"

## 3. Popup

- [x] 3.1 Add `lib/share/useShare.ts` (create on open, update on choice, error state, checkmark timer) and `lib/share/ExpiryPicker.tsx`; verify `useShare.test.ts*` with fake timers for "Checkmark after a choice" and "A failed choice keeps the earlier date", and `ExpiryPicker.test.tsx` for "The choices" and "Any choice is stored" (placeholder, no preselection)
- [ ] 3.2 Add `lib/share/ShareDialog.tsx` (modal dialog, link field, "Deel" or "Kopieer link", end date line, "Wijzig"); verify `ShareDialog.test.tsx` covers "Deel shows the link", "The popup closes", "Device with a share sheet", "Device without a share sheet", "End date after a choice", "No end date", "Existing share shows date and Wijzig" and "Wijzig shows the dropdown without a choice"
- [ ] 3.3 Enable "Deel" in `RecipeActionsMenu` through an `onShare` prop and open `ShareDialog` from `RecipeView`; remove the "Deel is disabled" test and requirement coverage; verify `RecipeActionsMenu.test.tsx` and `RecipeView.test.tsx`
- [ ] 3.4 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm test:spec share-create`, `pnpm test:ai`, `pnpm format:check` and `pnpm lint:check`; check the popup at 390px and 1280px in the browser with a stand-in member
