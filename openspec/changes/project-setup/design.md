# Design

## Context

The repo holds only a `package.json` that pins Node 24.15.0 through Volta, a `.gitignore`, and OpenSpec files. There is no lockfile, so no package manager has been chosen yet. See proposal.md for motivation and specs/family-access/spec.md for the behavior this design must deliver.

The developer knows React well and has no Cloudflare experience, so the design prefers the documented default path for each tool over anything custom.

## Goals / Non-Goals

**Goals:**

- One deployable: a single Worker that renders pages and talks to the database.
- A local loop (`npm run dev`) that needs no Cloudflare account.
- Identity that is verified cryptographically, not taken on trust from a header.
- As few moving parts as the specs allow.

**Non-Goals:**

- A data-access layer, ORM, or any table. The first table arrives with the recipe data model.
- An R2 bucket or binding. Adding it later is a few lines of config.
- CI. Deployment is a command run from the developer's machine.
- Infrastructure as code beyond the Wrangler config.
- A users table or profile. Identity is the verified email and nothing else.

## Decisions

### Scaffold with Cloudflare's React Router starter

Generate the app with `npm create cloudflare@latest -- --framework=react-router` and merge it into the repo. This produces React Router v8, the current release. The `cloudflare` template that used to live in `remix-run/react-router-templates` has been removed; that repo now points to Cloudflare's guide. The starter wires up Vite, the Cloudflare Vite plugin, a Worker entry and typed bindings, which is exactly the part that is easy to get wrong by hand.

- *Alternative: adding an ORM such as Drizzle.* Rejected for now: there are no tables yet, and plain D1 prepared statements are enough until queries get repetitive.
- *Alternative: hand-written setup.* Rejected: more work for the same result.

Use npm as the package manager, since nothing else is installed or configured.

### One workspace package, `packages/web`

The repo is an npm workspace and the whole app (source, Worker entry, migrations, tests, Wrangler and build config) lives in `packages/web` as `@cookbook/web`. The root `package.json` holds the Node pin and pass-through scripts, so `npm run dev`, `npm test` and the rest work from the repo root. No other packages exist yet; shared code gets its own package when a second consumer appears.

### Wrangler config is the only infrastructure definition

`wrangler.jsonc` declares the Worker, its custom-domain route, the D1 binding (`DB`) with `migrations_dir` set to `migrations/`, and two plain variables for identity verification (the Access team domain and the Access application audience tag). Neither variable is secret.

The config sets `workers_dev: false` and `preview_urls: false`. Those Cloudflare-provided addresses are not covered by the Access application on the custom domain, so leaving them on would expose a second way in.

- *Alternative: Terraform or Pulumi for DNS and Access.* Rejected: one Access application and one route do not justify a second tool. They are set up once in the dashboard and documented in the README.

### Verify the Access token in the app, and fail closed

Cloudflare Access attaches a signed JWT to every request it lets through (`Cf-Access-Jwt-Assertion`). A single function establishes identity for a request: it verifies the token's signature against the team's published keys, checks the audience tag and expiry, and returns the email claim, or nothing. It uses the `jose` library for verification.

The function is called in the Worker entry, which every request to the Worker passes through before React Router sees it. It returns 403 when no identity is established and otherwise hands the email to loaders through a React Router context. The Worker entry was chosen over route middleware because it also covers requests that match no route.

- *Alternative: trust the `Cf-Access-Authenticated-User-Email` header.* Rejected: any request that reaches the Worker by a path Access does not cover could set that header itself. Verifying the signature makes the app safe even if routing is misconfigured.
- *Alternative: hand-rolled verification with Web Crypto.* Rejected: JWT verification is easy to get subtly wrong, and this is the one security boundary in the app.

The function takes its inputs (request, team domain, audience, key source, optional stand-in email) as arguments and reads no globals, so it can be tested with Node's built-in test runner and a locally generated key pair, with no extra test framework.

### Stand-in identity for local development

Access does not run locally. A `DEV_USER_EMAIL` value in `.dev.vars` (git-ignored) stands in for the signed-in member. It is passed to the identity function only when the build is a development build (`import.meta.env.DEV`), so a production bundle cannot honor it whatever variables are set on the deployed Worker.

- *Alternative: skip identity entirely in development.* Rejected: loaders would then need two code paths.

### Migrations are plain SQL files applied by Wrangler

Schema changes are numbered `.sql` files in `migrations/`, created with `wrangler d1 migrations create` and applied with `wrangler d1 migrations apply`, locally and remotely. npm scripts wrap both. This change adds no migration; the home page runs `SELECT 1` against `DB` to prove the binding works.

### Home page as the end-to-end proof

One route renders on the server, queries D1, and shows the signed-in email. It is replaced when real pages exist.

## Risks / Trade-offs

- [The custom domain must exist on Cloudflare before the app can go live] → Local development does not depend on it; the cloud tasks are grouped last and marked as needing the owner.
- [Cloudflare's Zero Trust free plan may ask for a payment method] → Known from exploration; the owner confirms at signup.
- [Access misconfiguration (wrong audience tag or team domain) locks everyone out with 403] → The README lists where each value comes from; the failure is closed, not open.
- [Fetching the team's signing keys adds a network call] → `jose` caches the key set in memory per Worker instance; cost is one fetch per cold start.
- [`npm audit` reports a high-severity advisory in `sharp`, pulled in by Wrangler's local emulator] → It is a development-only dependency and is not part of the deployed Worker; it clears when Wrangler updates.
- [Deploying from a laptop means no deploy history beyond git] → Acceptable for one developer; CI can be added without changing anything here.

## Migration Plan

Greenfield, so there is nothing to migrate. Rollback of a bad deploy is `wrangler rollback` to the previous version.

## Open Questions

- Which domain name the cookbook will use. Only the route value in `wrangler.jsonc` and the Access application depend on it.
