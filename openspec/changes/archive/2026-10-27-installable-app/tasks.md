# Tasks

Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec installable-app` lists the delta scenarios still without a test. Tests for static files sit beside them in `public/` if the Vitest `include` allows it, otherwise next to `root.tsx`; settle that in 1.2.

## 1. Manifest and icons

- [x] 1.1 Draw `public/icons/icon.svg` (red square, cream seal 家 from `public/img/seal/jia.svg`, artwork inside the maskable safe zone) and render `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` and `apple-touch-icon.png` (180) from it with a one-off command; do not add a dependency
- [x] 1.2 Add `public/manifest.webmanifest` (name and short name "Familiekookboek", `start_url` and `scope` `/`, `display` `standalone`, `lang` `nl`, `theme_color` `#9c2419`, `background_color` `#f4eee0`, the three icons); test "installable-app › Manifest names the app", "Manifest uses the site colours" (compare with `--color-red` and `--color-por` in `app.css`) and "Icons are listed" (each file exists)

## 2. Pages

- [x] 2.1 In `root.tsx` add the manifest link (`crossOrigin: 'use-credentials'`) and the apple-touch-icon link to `links`, and render a `ThemeColor` component (`theme-color` meta, in `shared/components`) in the `Layout` head; test "Pages link the manifest" in `root.test.tsx` by calling `links()` and rendering `ThemeColor`

## 3. Service worker

- [x] 3.1 Add `public/sw.js`: a `fetch` listener that neither responds nor caches; test "Requests are not answered by the service worker" by running the file against a stub `self` and checking `respondWith` is never called
- [x] 3.2 Add `shared/components/ServiceWorker.tsx` (registers `/sw.js` in an effect, only when `'serviceWorker' in navigator`, errors swallowed) and render it once in `App` in `root.tsx`; component-test "Service worker is registered" and "No service worker support" (stub `navigator.serviceWorker`, restore it in `afterEach`)

## 4. Wrap-up

- [x] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec installable-app`; all clean
- [x] 4.2 Check by hand on a real Android phone and an iPhone after deploy: "Install"/"Add to Home Screen" is offered, the icon and name show, the app opens standalone with a red status bar, and signing in again after the Access session expires works; if an icon or the manifest is missing, add the Access bypass from design.md
