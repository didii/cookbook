## Why

The app sends no browser security headers, so any page can frame it (clickjacking) and nothing limits where scripts, styles or images may load from. Its forms and actions also rely on the Cloudflare Access cookie's `SameSite` attribute alone to stop another site from submitting them on behalf of a signed-in family member.

## What Changes

- Every response from the app carries security headers: a Content-Security-Policy (with `frame-ancestors 'none'`), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- The Content-Security-Policy allows exactly what the app loads today: its own scripts (with a per-request nonce for the inline ones the server renders), its own images plus `data:` and `blob:` images, and the Mulish font from Google Fonts.
- A request that changes data (any method other than GET, HEAD or OPTIONS) is refused with 403 when the browser says it comes from another origin. GET navigation and the Access login are not affected.

## Capabilities

### New Capabilities

- `security-headers`: the headers every response carries and the Content-Security-Policy that goes with them.
- `same-origin-requests`: data-changing requests are accepted only from the app's own origin.

### Modified Capabilities

None. `family-access` (who may reach the app) stays as it is; these are two new rules about every request.

## Impact

- `src/workers/handler.ts`: set the static headers on every response and refuse cross-origin unsafe requests.
- New `src/app/entry.server.tsx`: generates the nonce, passes it to `ServerRouter` and sets the Content-Security-Policy on document responses.
- `src/app/root.tsx`: pass the nonce to `Scripts` and `ScrollRestoration` if the router does not do it itself.
- No data, migration or dependency changes. Photo, manifest and service worker responses keep working; they only gain headers.
- Out of scope: Strict-Transport-Security (Cloudflare serves HTTPS and can add it), a CSP `report-uri`, and any Cloudflare dashboard setting.
