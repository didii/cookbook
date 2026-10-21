# Proposal

## Why

The home page is a flat list. With more recipes, family members cannot find a known recipe or look for inspiration, and nothing tells them what was added recently. The page is used mostly on a phone, so the controls must be in thumb reach. A "new for you" marker needs to know who the user is across requests, which also lays the base for future per-user features (settings, favorites).

## What Changes

Delivered as one change in five stacked PRs, in this order:

1. **button-press**: one press effect for every button with a hard shadow: the button moves down-right by the shadow's offset and loses the shadow while held (`:active`), `.08s`. Aligns `Button`, `TimerChip` (now 2px move and a 1px shadow, with a hover lift on the chip) and the new filter buttons.
2. **Home layout**: intro line, results count and a wider, shorter card image (5:2 on phones, 16:10 from 48rem) so two recipes fit on a phone screen. `RecipeCard`'s image sets `height: auto`, because its `width`/`height` attributes otherwise override the aspect ratio.
3. **recipe-filtering**: instant client-side search on title and author, author chips, sort (newest or A–Z), result count, no-results state, state in the URL. On phones the search bar is fixed to the bottom with a Filter button that opens a sheet with chips and sort; from 48rem the same controls sit inline.
4. **users**: a `users` table (id, email, calling name) and a welcome screen at `/welkom`. A member who is not in the table yet is welcomed there and asked their calling name (roepnaam), which creates their row. The base for later per-person features.
5. **recipe-new-marker**: a "Nieuw" badge on a card when the recipe is under one month old and the signed-in member has not opened it yet. Opening a recipe page records that the member has seen it.

## Capabilities

### New Capabilities
- `button-press`: how shadowed buttons react while pressed.
- `recipe-filtering`: searching, filtering and sorting the recipes on the home page, including the bottom bar and filter sheet.
- `users`: a stored record for each family member (email, calling name), created by a welcome screen on their first visit.
- `recipe-new-marker`: which recipes are shown as new to a member, and when that ends.

### Modified Capabilities
- `recipe-browsing`: intro text, results count, card image ratio, and what is shown with few or no recipes.
- `family-access`: a new member is asked, once, for their calling name; still no account or password.

## Impact

- `packages/web/app/shared/Button.tsx`, `routes/recipe/TimerChip.tsx`: press effect.
- `packages/web/app/routes/home/` (`route.tsx`, `RecipeCard.tsx`, new filter components), `lib/` (filter logic), `.server/recipes.ts` (`listRecipes` returns more fields).
- `packages/web/migrations/`: two new migrations (`users`, `recipe_views`).
- `packages/web/app/root.tsx` (redirects unknown members), new `routes/welcome/`, `.server/users.ts`; `routes/recipe/route.tsx` records a view.
- No new dependency. Sign-in itself (Access one-time code) is unchanged.
- Out of scope: searching on ingredients, a per-user "mark as unseen", favorites, tags and categories.
