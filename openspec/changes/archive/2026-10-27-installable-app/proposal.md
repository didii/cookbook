# Proposal

## Why

The family uses the cookbook on phones, in the kitchen. A browser tab with an address bar is clumsy there: the app cannot be put on the home screen and it has no icon of its own. Making it installable fixes that for little code. Full SPA mode and offline recipes were considered and are left out (see Out of scope).

## What Changes

- A web app manifest: name "Familiekookboek", `display: standalone`, theme colour the red of the header (`--color-red`, `#9c2419`), background colour the page colour (`--color-por`).
- App icons: 192 and 512 px, a maskable 512 px and an apple-touch-icon, all drawn from one SVG source (the red square with the cream seal 家 from the existing seals). A **placeholder**: the family can swap the source SVG and PNGs for a real design later without code changes.
- `root.tsx` links the manifest and the apple-touch-icon and sets `theme-color`, so every page (also the welcome screen) is installable and the phone's status bar takes the header colour.
- A minimal service worker (`/sw.js`) registered by the app, so browsers that require one offer "Install". It does not cache and does not answer any request itself.
- Out of scope: SPA mode (loaders read D1 and R2 on the Worker), offline access (board card #31), caching of any response, push notifications, an in-app "install" button.

## Capabilities

### New Capabilities

- `installable-app`: what the browser needs to offer the cookbook as an installed app: manifest, icons, theme colour and a service worker that stays out of the way.

### Modified Capabilities

None.

## Impact

- New static files in `public/`: `manifest.webmanifest`, `sw.js`, `icons/*`.
- `src/app/root.tsx` (`links`, `ThemeColor` in the head), small `shared/components/ThemeColor.tsx` and `ServiceWorker.tsx` (the latter mounted from `App`).
- No DB, API or dependency changes. Icon PNGs are generated once from the SVG and committed.
- The domain sits behind Cloudflare Access: see design.md for how the manifest, icons and service worker have to be fetched.
