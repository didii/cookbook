## Context

All requests go through `createFetch` in `src/workers/handler.ts`, which verifies the Access identity and then calls React Router's request handler. Documents are rendered by React Router's default `entry.server` (no custom one exists), which emits inline scripts for hydration and streaming. The app uses inline `style` attributes (`Plaid`, `Seal`, `Fret`, `TileBand`, list reordering) and a `data:` SVG background in `app.css`, loads the Mulish font from Google Fonts (`root.tsx` links) and registers `/sw.js`.

## Goals / Non-Goals

**Goals:** a CSP without `'unsafe-inline'` for scripts; headers on every response including error and 403 responses; a CSRF refusal that does not depend on cookie attributes.

**Non-Goals:** HSTS, CSP reporting, a CSRF token in forms, any dashboard setting.

## Decisions

- **Static headers in `handler.ts`, CSP in `entry.server.tsx`.** The four static headers are the same everywhere, so `createFetch` copies every response it returns (its own 403s included) into a new `Response` with each header set only when absent (spec: "A header the response already has is kept"). The CSP needs the nonce that the renderer also needs, so a new `src/app/entry.server.tsx` generates it (`crypto.getRandomValues`, 16 bytes, base64), passes it as `<ServerRouter nonce>`, and sets the header on `responseHeaders`. Alternative considered: generate the nonce in the handler and pass it through the router context; rejected because the renderer would then depend on handler behavior.
- **Start from the default Web entry.** The custom entry begins as a copy of `entry.server.web.tsx` from `@react-router/dev` (same streaming, bot handling and `HEAD` handling) and only adds the nonce and the header. If `Scripts` and `ScrollRestoration` in `root.tsx` do not pick the nonce up from `ServerRouter` in the installed React Router, pass it explicitly. The check is the scenario "Inline scripts carry the nonce".
- **`style-src 'unsafe-inline'`.** React `style={...}` attributes are blocked by `style-src` without it, and the app uses them in several places. Accepted: injected styles cannot run code; scripts stay strict.
- **`img-src data: blob:`** because of the CSS noise SVG and the photo upload preview (`blob:`). `frame-ancestors`, `base-uri` and `form-action` are not covered by `default-src`, so they are listed.
- **Origin check, not a token.** Browsers always send `Origin` on a cross-origin POST, and `Sec-Fetch-Site` when `Origin` is missing. Requests with neither (scripts, curl) pass: a browser cannot be made to send them, so they are not CSRF. The check sits in `handler.ts` before the request handler and returns through the same header-adding path as the identity 403.
- **Order in `createFetch`:** identity first, then origin. An unidentified request is 403 either way.
- **`Referrer-Policy: same-origin`** sends no referrer to Google Fonts. `Permissions-Policy` leaves the screen wake lock (cook mode) alone.

## Risks / Trade-offs

- A directive that is too tight silently breaks a feature (font, photo preview, service worker). Mitigation: the scenario "The page still works under the policy", checked by hand in a browser on a recipe page, the editor with a photo preview, and cook mode.
- If Cloudflare Web Analytics or another injector adds a script to pages, the CSP blocks it. None is configured in the repo; if one is on in the dashboard, turn it off or add its host to `script-src`.
- The origin check assumes `request.url` carries the public origin, as it does for a Worker on a custom domain.
