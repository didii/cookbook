# Design

## Context

See proposal.md. The app is a React Router SSR app on one Cloudflare Worker; files in `public/` are served by the Workers assets binding (`build/client`), before the Worker runs. The whole domain is behind Cloudflare Access, which answers a request without a valid cookie with a redirect to the sign-in page. `root.tsx` has the `links` export and renders `<Meta />` and `<Links />` for every page.

## Goals / Non-Goals

**Goals:**
- Chrome/Android and iOS offer "Install"/"Add to Home Screen" and the installed app opens standalone with the right name, icon and bar colour.
- No new dependency, no new build step.

**Non-Goals:**
- No SPA mode, no offline, no caching (card #31 owns offline).
- No design of the final icon.

## Decisions

**Static files in `public/`, not generated routes.** `manifest.webmanifest`, `sw.js` and `icons/` are plain files, served as they are. A route for the manifest would give the theme colour a single source in code, but a file is simpler; a test pins the manifest colours to the `--color-red` and `--color-por` tokens so they cannot drift silently.

**Link the manifest with `crossOrigin: 'use-credentials'`.** A `<link rel="manifest">` is fetched without cookies by default; behind Access that fetch would be redirected to the sign-in page and the manifest would fail to parse. With `use-credentials` the Access cookie is sent. Done through the `links` export in `root.tsx`; the theme colour is a `<meta name="theme-color">` in a small `ThemeColor` component rendered in the root `Layout` head. Not a root `meta` export: a page's own `meta` (every page sets a title) replaces the root's instead of merging, so the colour would vanish on those pages.

**Service worker: registered, no caching, no `respondWith`.** `sw.js` has a `fetch` listener that does nothing, which keeps installability on every Chrome version and never serves a stale page or a cached Access redirect. Alternative: cache static assets as originally asked. Rejected for now: the build's assets are hashed and already cached by the HTTP cache, so it adds stale-version risk for no speed or offline gain; real offline belongs to card #31 with a proper cache strategy. Registration lives in a `shared/components/ServiceWorker.tsx` rendered once from `App`, guarded by `'serviceWorker' in navigator`, with `register('/sw.js')` in an effect. Failure is swallowed (the app works without).

**One icon artwork, PNGs committed.** `public/icons/icon.svg`: red square with the cream seal 家 (`public/img/seal/jia.svg`) centred, inside the 80% maskable safe zone, so one drawing serves all sizes. PNGs (192, 512, 512 maskable, 180 apple-touch) are rendered once from it with a one-off command (not a dependency) and committed. Replacing the icon means replacing those files.

**Colours are duplicated, deliberately.** JSON and a `<meta>` cannot read CSS tokens. `#9c2419` and `#f4eee0` appear in the manifest and in `root.tsx`; a test (`manifest.test.ts`) compares them to `app.css`, as the token claim TESTING.md asks to live beside the file.

## Risks / Trade-offs

- [Access redirects the icon, manifest or `sw.js` fetch because the browser sends no cookie (iOS fetches the apple-touch-icon itself; some installers fetch icons without credentials)] → test the install on a real Android and iPhone. If an icon is missing, add an Access bypass policy for `/manifest.webmanifest`, `/sw.js` and `/icons/*` (dashboard setting, not in the repo; these files hold nothing private).
- [Access session expires inside the standalone app and the sign-in page opens in the app window] → not solvable here; the app itself caches nothing, so signing in again fixes it. Note the behaviour in the manual check.
- [A browser that wants a caching `fetch` handler for the install prompt] → the empty listener satisfies the installability check; if some browser still refuses, revisit with a network-first handler.
- [Placeholder icon ships] → stated in the proposal; replace the files whenever a real icon exists.

## Migration Plan

Deploy as usual (`pnpm deploy`). Rollback: revert the commit; installed copies keep their icon until reinstalled, and an orphaned `sw.js` registration dies when `/sw.js` 404s.
