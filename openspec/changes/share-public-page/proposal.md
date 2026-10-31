# Proposal

## Why

A shared recipe has to open for someone who is not a family member and has no Cloudflare Access session. Today every request without a verified identity gets a 403, and the only recipe page is full of member actions (back to the app, like, edit, notes, menu). The public side needs its own read-only page and a narrow way past the identity check.

## What Changes

- New public page `/share/<slug>`: the recipe as on the recipe page, without in-app navigation, like, actions menu, notes or site header. Ticking ingredients and steps, scaling, cook mode and timers keep working.
- The page is a **new view** (`SharedRecipeView`) built from the same underlying components as the recipe page. `RecipeView` gets no read-only mode and the two views share no member data.
- The Worker lets GET and HEAD requests for `/share/…` and `/foto/…` through without identity. Every other request keeps the 403.
- Public responses never carry member data, never record a view, ask search engines not to index them (`X-Robots-Tag`) and may be cached for a minute.
- For now the address uses the recipe's slug as a stand-in. `share-connect` replaces it by the share token and the expiry rules. **Until then every recipe would be public under a guessable address, so the Cloudflare Access Bypass for this path must not be configured before `share-connect` is merged.**

## Capabilities

### New Capabilities

- `shared-recipe-view`: the public, read-only page of a recipe and what it shows, allows and never shows.

### Modified Capabilities

- `family-access`: the public recipe page and stored photos are the only things reachable without identity.
- `security-headers`: public recipe pages ask not to be indexed.

## Impact

- New `routes/recipe/SharePageRoute.tsx` and `routes/recipe/lib/SharedRecipeView.tsx` in the recipe module, registered outside the layout route in `routes.ts`. They reuse the existing parts in `lib/`; nothing moves to `shared/`.
- `RecipeView`'s page state and header block are extracted into `lib/useCooking.ts` and `lib/RecipeHead.tsx`, used by both views.
- `src/workers/handler.ts` (public request check, response headers, short cache), `shared/context.server.ts` (a public-request flag), `root.tsx` (no user lookup for a public request).
- Start after `remove-app-timers` is merged: that change edits `RecipeView` and the timer files this one builds on.
- Independent of `share-create`.
