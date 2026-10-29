# Security audit

Audit of the code and config in the repo, 2026-10-26. The live site, the Cloudflare dashboard and the GitHub settings were not inspected. Result: no critical holes found; the gaps are listed under "To do".

## Deploying

- CI (`.github/workflows/ci.yml`) has `contents: read` only. It uses no secrets and has no deploy step.
- Deploy is manual: `pnpm deploy` runs `wrangler deploy` from a developer machine after `wrangler login`. Only people with access to the Cloudflare account can deploy.
- The repo is public. No secrets are tracked; `.dev.vars` is gitignored. `wrangler.jsonc` shows the Access AUD tag, the team domain and the superadmin email. None are secrets, but the email is a phishing target.
- To check by hand:
  - 2FA on the Cloudflare account and on GitHub.
  - Branch protection on `main`.
  - Settings > Actions: require approval for fork PR workflows.
  - If a CI deploy is ever added: a scoped API token, never the global key.

## Database and access

- D1 has no public endpoint; only the Worker reaches it.
- Every request is checked in `src/workers/handler.ts` and `identity.ts`: the Cloudflare Access JWT is verified (RS256, issuer and audience pinned). Empty config fails closed with a 403.
- `DEV_USER_EMAIL` only works when `import.meta.env.DEV` is true, which is compiled out of production builds.
- `workers_dev: false` and `preview_urls: false` keep the addresses without Access closed.
- Residual risk: Access is the only gate.
  - A mistake in the Access policy opens the whole app. Check that it lists only the family's emails and allows only the One-time PIN login method.
  - Anyone on the allowlist can create a user row.
- Files in `public/` and the built JS and CSS may be served without the Worker, so Access does not cover them. Nothing sensitive may go in `public/`.

## Injection and code execution

- **SQL injection: none found.**
  - Every query uses `.prepare().bind()`.
  - The only string interpolation is a hardcoded fragment (`where` in `tagManagement.server.ts` is `'name = ?'` or a constant, and `${id}` is a constant subquery).
  - Rule for new code: no user input in those template strings.
- **XSS: none found.** The app has no `dangerouslySetInnerHTML`, `innerHTML` or `eval`; React escapes what it renders.
- **Image links:** `acceptImage` accepts only `/foto/<uuid>.(jpg|png|webp)` paths or the stored value, so nobody can plant an external or `javascript:` URL.
- **Photo uploads:** type from the magic bytes (not the name), 2 MB cap, random UUID name, `nosniff` when served.
- **Fetch endpoints (recipe import):** `POST /importeren/pagina` and `/importeren/foto` fetch other sites for the signed-in member.
  - `safeFetch.server.ts` is the one guard: only `http(s)`, no credentials, no `localhost`, `.local` or `.internal`, no private, loopback or reserved IP literals, at most 5 redirects (each hop checked), 10 s timeout, content type checked, body cut at 5 MB (page) or 2 MB (image).
  - Rate limit: 30 requests per 60 s per member.
  - Ceiling: a name that resolves to a private address is not caught, because a Worker has no DNS lookup. It stays safe because a Worker's `fetch` runs on Cloudflare's edge and cannot reach a private network. If the app ever fetches from inside a network, add a resolver check.
- **Open redirect:** `safeReturnUrl` handles `//`, `\`, control characters and origin checks.
- **Authorization:**
  - Admin and superadmin routes call `requireAdmin` / `requireSuperadmin` in both loader and action.
  - Superadmin creation is one statement, so it cannot race.
  - The last superadmin cannot be deleted or demoted.

## To do

Most useful first.

1. **Security headers.** There is no CSP, `frame-ancestors` / `X-Frame-Options`, `Referrer-Policy` or `Permissions-Policy`. Add them in one place by wrapping the response in `handler.ts`. The CSP must allow `fonts.googleapis.com` and `fonts.gstatic.com`, and React Router needs an inline script or a nonce. Without `frame-ancestors 'none'`, clickjacking is possible.
2. **CSRF.** Actions rely on the Access cookie being `SameSite`. Check the Access application's SameSite attribute: if it is `None`, a malicious page could submit forms for a signed-in member. Cheap fix: reject POST requests whose `Origin` header does not match the host.
3. **Roles on recipes and tags.** Any member can edit and delete recipes and merge or delete tags, and upload photos. Fine for a family app, but one compromised mailbox can wipe the book. Consider D1 time-travel backups and an occasional export.
4. **Length caps.** Title, intro, steps, ingredients and tag count have no server-side limit (notes and photos do). Add caps in `recipeValidation.ts`.
5. **Photo cache.** Photos are `private, max-age=31536000, immutable`, so a browser keeps a deleted recipe's photo. Low impact.
6. **Dependencies.** Run `pnpm audit` and turn on Dependabot. `allowBuilds` is already limited to esbuild and workerd.
7. **Monitoring.** Keep `observability` on and check the Access logs for failed logins.
