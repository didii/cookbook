## Context

Forms and fetchers (`<Form>`, `useFetcher`) and client-side navigation use `fetch()`. Behind Cloudflare Access an expired session makes Access answer with a 302 to `https://<team>.cloudflareaccess.com/...`. `fetch` follows it, the other origin sends no CORS headers, and the call rejects with a `TypeError` ("Failed to fetch") that carries no sign of the redirect. React Router passes the rejection to the nearest `ErrorBoundary`, which is the one in `root.tsx`. No route has its own.

A document navigation is not affected: the browser follows the redirect to the sign-in itself.

## Goals / Non-Goals

**Goals:** recognize the expired session from the failure; send the member to sign in without losing the editor draft.

**Non-Goals:** warning ahead of expiry, renewing the session, changing its length.

## Decisions

- **Detect with a probe.** In the `ErrorBoundary`, when the error is a `TypeError`, request the current page with `fetch(location.href, { method: 'HEAD', redirect: 'manual' })`. A manual same-origin redirect gives a response of type `opaqueredirect`, which is the expired session. The probe rejecting means no connection; any other response means the failure had another cause. Alternative considered: wrapping every `clientAction`/`clientLoader` or patching `fetch`; rejected because the root boundary already sees every such failure and it is one place.
- **Redirect by reloading.** `location.reload()` is a document navigation, so the browser follows Access's redirect to the sign-in (the CSP `form-action` and `connect-src` do not apply to navigations), and Access returns the member to the same URL after signing in. A reload of a page that was reached by a failed save is the page the form was on (the editor), which restores its draft.
- **No draft code.** `endDraftAfterSave` clears the draft only after a successful save, so a failed one leaves it in `localStorage`. The scenario "Edits come back after signing in" is covered by the existing "A reload restores the draft" test plus the unit tests of the check.
- **While probing, render only a short line** ("Opnieuw inloggen…") so the member never sees the raw error flash by; if the probe says it is not an expired session, the error page appears as now.
- **Where the code lives.** The check is a function in `shared/` (`isSessionExpired`, takes a `fetch` so a test can pass one); the boundary in `root.tsx` calls it from an effect.

## Risks

- A reload loop if the probe is redirected but the document is not. They go through the same Access policy, so this does not happen in practice; no guard is added.
- `redirect: 'manual'` also gives `opaqueredirect` for a redirect that is not Access's. The app has no own redirects on a `HEAD` of an existing page; the welcome redirect only applies to members without a user row, and reloading then lands on the welcome page, which is right.
